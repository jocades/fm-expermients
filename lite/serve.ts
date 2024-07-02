import fs from 'node:fs/promises'
import { Hono, type Context } from 'hono'
import { logger } from 'hono/logger'
import type { API_METHODS } from './consts'
import type { MaybePromise } from './types'
import { default as p } from 'node:path'

type APIMethod = (typeof API_METHODS)[number]
type API = Partial<Record<APIMethod, (c: Context) => MaybePromise<Response>>>

const re = {
  js: /^(.+)\.(ts|js|mjs)$/,
  jsx: /^(.+)\.(tsx|jsx|js|mjs)$/,
  html: /^(.+)\.html$/,
  // // regext to match agains '/index' or 'index' at the end of a string
  // index: /\/?index$/,
}

const Paths = Object.freeze({
  API: 'app/api',
  PAGES: 'app/pages',
  BROWSER: 'app/browser',
  HEAD: 'app/head',
})

// test.pages.forEach((file) => {
//   const match = file.match(re.pages)
//   const route = '/' + match?.[1].replace('/index', '')
//   console.log(match)
//   console.log(route)
// })

class Lite {
  router = new Hono()
  // io = new SocketServer()

  head?: (c: Context) => string

  constructor() {
    this.router.use(logger())
  }

  async init() {
    this._setup()

    const files = await fs.readdir('app', { recursive: true })

    for (const file of files) {
      if (file.startsWith('pages/')) {
        // pages/index.html -> /
        // pages/about.html -> /about

        const regex = /^pages\/(.+)\.html$/
        const match = file.match(regex)
        if (!match) continue

        const route = '/' + match[1].replace('index', '')
        // console.log(route)

        this.router.get(route, async (c) => {
          let html = this.head?.(c) ?? ''
          const page = Bun.file(`app/${file}`)

          html += await page.text()
          html += '</body>\n</html>'
          return c.html(html)
        })
      }

      if (file.startsWith('browser/')) {
        const route = '/' + file.replace(/^browser\//, '@/')
        // console.log(route)

        const resource = Bun.file(`app/${file}`)

        this.router.get(route, async (c) => {
          c.header('content-type', resource.type)
          return c.body(await resource.arrayBuffer())
        })
      }
    }
  }

  private async _setup() {
    await this._setupAPI()
  }

  private async _setupAPI() {
    for (const path of await fs.readdir(Paths.API, { recursive: true })) {
      const match = path.match(re.js)
      if (!match) continue

      const route = this._makeRoute(match[1], '/api')
      console.log(route)
      const { get, post, put, del }: API = await this._import({ api: path })
      if (get) this.router.get(route, get)
      if (post) this.router.post(route, post)
      if (put) this.router.put(route, put)
      if (del) this.router.delete(route, del)
    }
  }

  private _setupPages() {}

  private _setupBrowser() {}

  private async _import(
    path: string | Partial<Record<Lowercase<keyof typeof Paths>, string>>,
  ) {
    if (typeof path === 'string') {
      path = `../app/${path}`
    } else {
      const [key, file] = Object.entries(path)[0]
      path = `../${Paths[key.toUpperCase() as keyof typeof Paths]}/${file}`
    }

    const mod = await import(path)
    // TODO: add some error handling
    return mod
  }

  private _makeRoute(path: string, prefix = '/') {
    const endpoint = path.replace(/\/?index$/, '')
    return `${prefix}${endpoint ? '/' + endpoint : ''}`
  }
}

const app = new Lite()

await app.init()

export default {
  port: 6969,
  fetch: app.router.fetch,
  // websocket: app.io.websocket,
}
