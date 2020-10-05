/**
 * 
 * @param {*} type 根据jsx的大小写区分，plugin 会自动决定是传入字符串(native tag) 还是子组件class
 * @param {*} attributes 标签上的属性集合 (对象)
 * @param  {...any} children 从第三个参数之后的所有参数都是子节点
 */
export function createElement(type, attributes, ...children) {
  let elem
  if (typeof type === "string") {
    // 创建原生标签
    elem = new ElementWrapper(type)
  } else {
    // 创建子组件
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
        // child = new TextWrapper(child)
      } else if (child instanceof Array) {
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
    this.root.setAttribute(name, value)
  }
  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextWrapper {
  constructor(type) {
    console.log(`creating text node: ${type}`)
    this.root = document.createTextNode(type)
  }
  // setAttribute(name, value) {
  //   this.root.setAttribute(name, value)
  // }
  // appendChild (child) {
  //   this.root.appendChild(child)
  // }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get root() {
    if (!this._root) {
      this._root = this.render().root
    }
    return this._root
  }
}

export function render(component, parentElement) {
  parentElement.appendChild(component.root)
}