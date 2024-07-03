import { parseFragment } from 'parse5'

interface DocumentFragment {
  nodeName: '#document-fragment'
  childNodes: (Node | TextNode)[]
}

interface Node {
  nodeName: string
  attrs?: { name: string; value: string }[]
  childNodes: (Node | TextNode)[]
  parentNode: Node | null
  value?: string
}

interface TextNode {
  nodeName: '#text'
  value: string
  parentNode: Node
}

export function parse5(src: string) {
  return parseFragment(src) as DocumentFragment
}

type WalkerCallback = (node: Node, depth: number) => boolean | void

export function walk(node: any, cb: WalkerCallback, depth = 0) {
  if (cb(node, depth)) {
    return true // stop walking if callback returns true
  }

  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i], cb, depth + 1)) {
        return true
      }
    }
  }
  return false
}

class AstWalker {
  /** Custom HTML attributes */
  private static _attrs = {
    FILE: 'lite:file',
    FRAGMENT: '@frag',
  }

  private _ast!: Node

  async parse(path: string) {
    const content = await Bun.file(path).text()
    const document = parseFragment(content)
    this._ast = document as any
    this.walk((node, depth) => {
      if (depth >= 1) {
        console.log(node)
      }
    })
  }

  query(selector: string): Node | null {
    let result: Node | null = null
    this.walk((node) => {
      if (this._match(node, selector)) {
        result = node
        return true // stop walking
      }
    })
    return result
  }

  queryAll(selector: string): Node[] {
    const result: Node[] = []
    this.walk((node) => {
      if (this._match(node, selector)) {
        result.push(node)
      }
    })
    return result
  }

  private _match(node: Node, selector: string): boolean {
    // '[prop]' | '[prop=value]'
    if (selector.startsWith('[')) {
      const [key, value] = selector
        .slice(1, -1)
        .split('=')
        .map((s) => s.trim())

      if (!value) {
        return this.hasAttr(node, key)
      } else {
        return this.getAttr(node, key) === value
      }
    }

    // 'div'
    return node.nodeName === selector
  }

  walk(cb: WalkerCallback) {
    walk(this._ast, (node, depth) => {
      return cb(node, depth)
    })
  }

  getAttr(node: Node, key: string): string | null {
    return node.attrs?.find((attr) => attr.name === key)?.value ?? null
  }

  hasAttr(node: Node, key: string): boolean {
    return !!node.attrs?.some((attr) => attr.name === key)
  }

  removeAttr(node: Node, key: string) {
    const index = node.attrs?.findIndex((attr) => attr.name === key)
    if (index === undefined || index === -1) return
    node.attrs?.splice(index, 1)
  }

  replace(node: Node, content: string) {
    node.childNodes = parseFragment(content).childNodes as Node[]
  }
}

// const dom = new AstWalker()
// dom.parse('lite/sample.html')

// const div = dom.query('div')
// console.log(div)

// const divs = dom.queryAll('div')
// console.log(divs)
