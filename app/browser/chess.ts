const registry: [string, CustomElementConstructor][] = []

// decorators
function customElement(tagName: string) {
  return (target: CustomElementConstructor) => {
    // registry.push([tagName, target])
    customElements.define(tagName, target)
  }
}

/* function init() {
  for (let [tagName, CustomElement] of registry) {
    customElements.define(tagName, CustomElement)
  }
} */

function query(selector: string) {
  return (target: MyElement, key: string) => {
    Object.defineProperty(target, key, {
      get() {
        return this.shadowRoot!.querySelector(selector)
      },
    })
  }
}

@customElement('my-element')
class MyElement extends HTMLElement {
  @query('button')
  button!: HTMLButtonElement

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <button>0</button>
    `
  }

  connectedCallback() {
    this.button.onclick = () => {
      this.button.textContent = (Number(this.button.textContent) + 1).toString()
    }
  }
}
