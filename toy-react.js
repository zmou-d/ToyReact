/**
 * 
 * @param {*} type 根据jsx的大小写区分，plugin 会自动决定是传入字符串(native tag) 还是子组件class
 * @param {*} attributes 标签上的属性集合 (对象)
 * @param  {...any} children 从第三个参数之后的所有参数都是子节点
 */

const RENDER_TO_DOM = Symbol('private function(renderToDOM)')

function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()
  
  range.setStartBefore(node)
  range.setEndAfter(node)
}

export function createElement(type, attributes, ...children) {
  let elem
  if (typeof type === "string") {
    // 创建原生标签
    elem = new ElementWrapper(type)
  } else {
    // 创建子组件
    // * 传入 props, 简易支持 function api
    elem = new type
  }
  for (let attr in attributes) {
    elem.setAttribute(attr, attributes[attr])
  }
  const insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === "string") {
        // native tag
        elem.appendChild(new TextWrapper(child))
      } else if (child === null) {
        continue
      } else if ((typeof child === "object") && (child instanceof Array)) {
        // this.children
        insertChildren(child)
      } else {
        elem.appendChild(child)
      }
    }
  }
  insertChildren(children)
  return elem
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
    this.extComponent = true
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get vdom() {
    return this.render().vdom
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }
  update() {
    const nodeIsIdentical = (oldNode, newNode) => {
      // type
      if (oldNode.type !== newNode.type) return false
      
      // props
      for (let propKey in newNode.props) {
        if (newNode.props[propKey] !== oldNode.props[propKey]) return false
      }

      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) return false

      if (newNode.type === "#text" && newNode.content !== oldNode.content) return false

      return true
    }
    const update = (oldNode, newNode) => {
      if (!nodeIsIdentical(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range
      
      const newChildren = newNode.vchildren
      const oldChildren = oldNode.vchildren

      if (!newChildren || !newChildren.length) {
        return
      }

      let tailRange = oldChildren[oldChildren.length - 1]._range

      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i]
        const oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild, newChild)
        } else {
          const range = document.createRange()
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange = range
        }
      }
    }
    const vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
  }
  
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      return
    }
    const merge = (oldState, newState) => {
      for (let key in newState) {
        if (oldState[key] === null || typeof oldState[key] !== 'object') {
          oldState[key] = newState[key]
        } else {
          merge(oldState[key], newState[key])
        }
      }
    }
    merge(this.state, newState)
    this.update()
  }
}
class ElementWrapper extends Component {
  constructor(type) {
    super(type)
    this.type = type
    this.label = 'vdom-elem-wrapper'
  }
  get vdom() {
    this.vchildren = this.children.map(child => child.vdom)
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range

    const root = document.createElement(this.type)

    for (let name in this.props) {
      const value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else if (name === 'className') {
        root.setAttribute('class', value)
      } else {
        root.setAttribute(name, value)
      }
    }

    if (!this.vchildren) this.vchildren = this.children.map(child => child.vdom)

    for (let child of this.vchildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }

    // range.insertNode(root)
    // console.log(range)
    replaceContent(range, root)
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = "#text"
    // this.root = document.createTextNode(content)
    this.content = content
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    const root = document.createTextNode(this.content)
    replaceContent(range, root)
  }
  get vdom() {
    return this
  }
}

export function render(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}