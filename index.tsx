import fs from 'node:fs/promises'
import { Hono, type Context, type Handler } from 'hono'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { logger } from 'hono/logger'

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'options'] as const

type HTTPMethod = (typeof HTTP_METHODS)[number]
type API = Partial<Record<HTTPMethod, Handler>>

// const pages = new Map<string, string>()

class Lite {
  router = new Hono()
  head?: (c: Context) => string

  constructor() {
    this.router.use(logger())
  }

  async init() {
    const files = await fs.readdir('app', { recursive: true })
    // console.log(files)

    for (let file of files) {
      if (file === 'head.ts') {
        const mod = await import(`./app/${file}`)
        this.head = mod.default
      }

      if (file.startsWith('api/')) {
        if (!file.endsWith('.ts')) continue

        const path = '/' + file.replace(/\.ts$/, '').replace('/index', '')
        console.log(path)

        const { get, post }: API = await import(`./app/${file}`)
        if (get) this.router.get(path, get)
        if (post) this.router.post(path, post)
      }

      if (file.startsWith('pages/')) {
        // pages/index.html -> /
        // pages/about.html -> /about

        const regex = /^pages\/(.+)\.html$/
        const match = file.match(regex)
        if (!match) continue

        const path = '/' + match[1].replace('index', '')
        console.log(path)

        this.router.get(path, async (c) => {
          let html = this.head?.(c) ?? ''
          const page = Bun.file(`app/${file}`)

          html += await page.text()
          html += '</body>\n</html>'
          return c.html(html)
        })
      }

      if (file.startsWith('browser/')) {
        const path = '/' + file.replace(/^browser\//, '@/')
        console.log(path)

        const resource = Bun.file(`app/${file}`)

        this.router.get(path, async (c) => {
          c.header('content-type', resource.type)
          return c.body(await resource.arrayBuffer())
        })
      }
    }

    /* this.router.get('*', async (c) => {
      const path = c.req.path === '/' ? '/index' : c.req.path

      const page = Bun.file(`app/pages${path}.html`)
      if (!(await page.exists())) {
        return c.text('404 Not Found', 404)
      }

      let html = this.head?.(c) ?? ''
      html += await page.text()
      html += '</body>\n</html>'

      return c.html(html) */
    // })
  }
}

const app = new Lite()

await app.init()

export default {
  port: 6969,
  fetch: app.router.fetch,
}
