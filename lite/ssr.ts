import type { BunFile } from 'bun'

let title = 'SSR'

function open(path: string) {
  return Bun.file(path).text()
}

class SSREngine {
  // dependency graph, keep track which templates depend on which
  graph = new Map<string, string[]>()

  async parse(src: string) {
    return new HTMLRewriter()
      .on('*', {
        element: async (el) => {
          switch (el.tagName) {
            case 'root':
              break
            case 'title':
              console.log('title', el)
              break
            case 'fragment':
              await this.fragment(el)
              break
          }
        },
        comments(com) {
          // console.log('comment', comment)
        },
        text(part) {
          // console.log('text', text)
        },
      })
      .transform(src)
  }

  async fragment(el: HTMLRewriterTypes.Element) {
    const path = el.getAttribute('lite:file')
    if (!path) return

    const content = await this.parse(await open(`lite/${path}`))
    el.replace(content, { html: true })
  }
}

const engine = new SSREngine()

let content = await engine.parse(await open('lite/page.html'))
console.log(content)

// replace empty lines
// content = content.replace(/^\s*[\r\n]/gm, '')
// console.log(content)
//
