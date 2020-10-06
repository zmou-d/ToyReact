/**
 * 
 * @param {*} type 根据jsx的大小写区分，plugin 会自动决定是传入字符串(native tag) 还是子组件class
 * @param {*} attributes 标签上的属性集合 (对象)
 * @param  {...any} children 从第三个参数之后的所有参数都是子节点
 */

const RENDER_TO_DOM = Symbol('private function(renderToDOM)')

export function createElement(type, attributes, ...children) {
  let elem
  if (typeof type === "string") {
    // 创建原生标签
    elem = new ElementWrapper(type)
  } else {
    // 创建子组件
    // * 传入 props, 简易支持 function api
    elem = new type(attributes)
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
      } else if (child instanceof Array) {
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

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else if (name === 'className') {
      this.root.setAttribute('class', value)
    } else {
      this.root.setAttribute(name, value)
    }
  }
  appendChild(component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    const renderRes = this.render()
    renderRes[RENDER_TO_DOM](range)
  }
  rerender() {
    this._range.deleteContents()
    this[RENDER_TO_DOM](this._range)
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.rerender()
      return
    }
    const merge = (oldState, newState) => {
      for (let key in newState) {
        if (oldState.key === null || typeof oldState.key !== 'object') {
          oldState[key] = newState[key]
        } else {
          merge(oldState[key], newState[key])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }
}

export function render(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  component[RENDER_TO_DOM](range)
}