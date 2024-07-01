import { parse, parseFragment } from 'parse5'

// const src = `<button prop="value">Hello</button>`

// const document = parse(`<main>
//   <h1>Hello, world!</h1>
//   <file src="fragment.html"></template>
// </main>`)

// const document = parse(src)

interface Node {
  nodeName: string
  attrs: Record<keyof HTMLElement, string>
  childNodes?: Node[]
  parentNode: Node | null
}

// for (let i = 0; i < document.childNodes.length; i++) {
//   const node = document.childNodes[i]
//   console.log(node)
// }

// create a walker wich will traverse the tree in depth-first order
// using yield* to recursively iterate over child nodes as fast as possible
function* walk(node: any): Generator<Node> {
  yield node

  for (let i = 0; i < node.childNodes?.length; i++) {
    yield* walk(node.childNodes[i])
  }
}

const page = await Bun.file('lite/page.html').text()
const fragment = await Bun.file('lite/fragment.html').text()

// const document = parse(page)
const documentFragment = parseFragment(fragment)

// iterate over all nodes in the tree
for (const node of walk(documentFragment)) {
  // delete node.parentNode
  // console.log(node, '')
}

// const fragment = `<template lite:file="fragment.html"></template>`

// const documentFragment = parseFragment(fragment)

// console.log('== fragment ==')
//
// for (let i = 0; i < documentFragment.childNodes.length; i++) {
//   const node = documentFragment.childNodes[i]
//   console.log(node)
// }

// console.log(documentFragment.childNodes[0])
