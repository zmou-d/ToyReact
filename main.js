import { createElement ,Component, render } from './toy-react'
// const elem =
//   <side id="myside" class="side">
//     <div>node1</div>
//     <div>node2</div>
//     <div>node3</div>
//   </side>

class MyComponent extends Component {
  render() {
    return (<div>
      <span>my component start</span>
      {this.children}
      <span>my component end</span>
    </div>)
  }
}

// const root = document.querySelector('#app')
// root.appendChild(elem)
render(
  <MyComponent id="my" class="component">
    <side id="myside" class="side">
      <div>node1</div>
      <div>node2</div>
      <div>node3</div>
    </side>
  </MyComponent>,
  document.querySelector("#app")
)