import { open } from './util'
import { walk } from './walker.bak'
import { serialize, serializeOuter } from 'parse5'
import { parse5 } from './walker.bak'

function rewrite(
  src: string,
  selector: string,
  handlers:
    | HTMLRewriterTypes.HTMLRewriterElementContentHandlers
    | HTMLRewriterTypes.HTMLRewriterElementContentHandlers['element'],
) {
  if (typeof handlers === 'function') {
    return new HTMLRewriter().on(selector, { element: handlers }).transform(src)
  }

  return new HTMLRewriter().on(selector, handlers!).transform(src)
}

const check = {
  tag: (name: string, el: HTMLRewriterTypes.Element) => name === el.tagName,
}

const scripts = new Map<string, string>()
const styles = new Map<string, string>()
const templates = new Map<string, any>()

const source = `
<script>
  console.log('Loaded')
  
  const x = 'Hello'

  function onclick() {
    console.log('Clicked')
  }

</script>

<style>
  button {
    background: red;
  }
</style>

<div>
  <button>Click Me</button>
</div>
`

export class SSREngine {
  // dependency graph, keep track which templates depend on which
  graph = new Map<string, string[]>()

  title = 'SSR'

  // extract styles and script always are top level elemtns
  async extract(path: string) {
    const doc = parse5(await open(path))

    let js = ''
    let css = ''
    let node

    for (const child of doc.childNodes) {
      if (child.nodeName === '#text') continue

      if (child.nodeName === 'script') {
        if (js) throw new Error(`Multiple scripts found in ${path}`)
        js = child.childNodes[0].value!
      } else if (child.nodeName === 'style') {
        if (css) throw new Error(`Multiple styles found in ${path}`)
        css = child.childNodes[0].value!
      } else if (child.nodeName === 'title') {
        this.title = child.childNodes[0].value!
      } else {
        if (node) throw new Error(`Multiple nodes found in ${path}`)
        node = child
      }
    }

    return { css, js, node }
  }

  rewrite(src: string) {
    return new HTMLRewriter().on('title', {}).on('fragment', {}).transform(src)
  }

  async render(src: string) {
    return rewrite(src, '*', {
      element: async (el) => {
        switch (el.tagName) {
          case 'title':
            // this.title = 'Changed Title'
            // el.remove()
            break
          case 'fragment':
            await this.fragment(el)
            break
        }
      },
      text: (content) => {},
    })
  }

  async renderRoot(page = 'index.html') {
    const body = await this.render(await open(`app/pages/${page}`))
    const head = await open('app/head.html')

    return rewrite(head, '*', (el) => {
      if (check.tag('title', el)) {
        el.setInnerContent(this.title)
      }

      if (check.tag('slot', el)) {
        el.replace(body, { html: true })
      }
    })
  }

  async fragment(el: HTMLRewriterTypes.Element) {
    const path = el.getAttribute('@src')
    if (!path) return

    const content = await this.render(await open(`app/frags/${path}`))
    el.replace(content, { html: true })
  }
}

/* const engine = new SSREngine()

const file = 'extract.html'

const { css, js, node } = await engine.extract(`app/pages/${file}`)
// console.log(serializeOuter(node))

const page = `
  <html lang="en">
  <head>
    <title>${engine.title}</title>
    <style>${css}</style>
  </head>
  <body>
    ${serializeOuter(node)}
    <script type="module">${js}</script>
  </body>
  </html>
`

console.log(page)
await Bun.write(`build/${file}`, page) */
