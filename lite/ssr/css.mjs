import * as csstree from 'css-tree'

const tagName = 'my-element'

const css = `
  .foo {
    color: red;
  }

  button {
    color: green;
  }
`

const ast = csstree.parse(css)

// traverse the AST and modify it

csstree.walk(ast, (node) => {
  // create css which targets the custom element instead of the class so
  // button -> my-element button and .foo -> my-element .foo etc..
  console.log(node.type, node.name)
  if (node.type === 'ClassSelector') {
    node.name = `${tagName} ${node.name}`
  }

  if (node.type === 'TypeSelector') {
    node.name = `${tagName} ${node.name}`
  }
})

// serialize
const modifiedCss = csstree.generate(ast)
console.log(modifiedCss)
