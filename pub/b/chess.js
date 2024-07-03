var __legacyDecorateClassTS = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1;i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

// app/browser/chess.ts
var customElement = function(tagName) {
  return (target) => {
    customElements.define(tagName, target);
  };
};
var query = function(selector) {
  return (target, key) => {
    Object.defineProperty(target, key, {
      get() {
        return this.shadowRoot.querySelector(selector);
      }
    });
  };
};
class MyElement extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <button>0</button>
    `;
  }
  connectedCallback() {
    this.button.onclick = () => {
      this.button.textContent = (Number(this.button.textContent) + 1).toString();
    };
  }
}
__legacyDecorateClassTS([
  query("button")
], MyElement.prototype, "button", undefined);
MyElement = __legacyDecorateClassTS([
  customElement("my-element")
], MyElement);
