import { open } from './util'

function parse(
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

export class SSREngine {
  // dependency graph, keep track which templates depend on which
  graph = new Map<string, string[]>()

  title = 'SSR'

  async render(src: string) {
    return parse(src, '*', {
      element: async (el) => {
        switch (el.tagName) {
          case 'title':
            this.title = 'Changed Title'
            el.remove()
            break
          case 'fragment':
            await this.fragment(el)
            break
        }
      },
      text: (content) => {},
    })
  }

  async renderRoot() {
    const body = await this.render(await open('app/pages/index.html'))
    const head = await open('app/head.html')

    return parse(head, '*', (el) => {
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

const engine = new SSREngine()

let content = await engine.renderRoot()
console.log(content)

await Bun.write('build/index.html', content)
