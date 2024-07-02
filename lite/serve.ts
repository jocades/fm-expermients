import fs from 'node:fs/promises'
import { Hono, type Context } from 'hono'
import { logger } from 'hono/logger'
import { Path, type API_METHODS } from './consts'
import type { MaybePromise } from './types'
import { SocketServer } from 'pcall/ws'
import { open, readdir } from './util'
import { join } from 'node:path'
import { SSREngine } from './ssr'
import { transpile } from 'typescript'
import { serveStatic } from 'hono/bun'

// @ts-ignore
globalThis.what = () => {
  console.log('what')
}

declare global {
  function what(): void
}

what()

const transpiler = new Bun.Transpiler({ loader: 'ts' })

type APIMethod = (typeof API_METHODS)[number]
type API = Partial<Record<APIMethod, (c: Context) => MaybePromise<Response>>>

const re = {
  js: /^(.+)\.(ts|js|mjs)$/,
  jsx: /^(.+)\.(tsx|jsx|js|mjs)$/,
  html: /^(.+)\.html$/,
  index: /\/?index$/,
}

class Lite {
  router = new Hono()
  io = new SocketServer()
  ssr = new SSREngine()

  private _dev = false

  constructor() {
    this.router.use(logger())
  }

  async init() {
    await this._setup()
  }

  async initDev() {
    this._dev = true
    await this._setup()
  }

  // in dev we should not map the file paths to routes when initializing the app
  // since we may change the file structure and the routes will be invalid
  // this will not happen in production and ensures more security since we are not
  // exposing the file structure to the client
  private async _setup() {
    await this._setupPub()
    await this._setupAPI()
    await this._setupPages()
    await this._setupBrowser()
  }

  private async _setupPub() {
    if (!((await fs.exists('pub')) || !(await fs.exists('public')))) {
      return
    }

    this.router.get('favicon.ico', async (c) => {
      const file = await open('pub/favicon.ico', 'arrayBuffer')
      c.header('content-type', 'image/x-icon')
      return c.body(file)
    })

    this.router.get('/pub/*', serveStatic({ root: 'pub' }))
  }

  private async _setupAPI() {
    for (const path of await fs.readdir(Path.API, { recursive: true })) {
      const match = path.match(re.js)
      if (!match) continue

      console.log(path)

      const route = this._makeRoute('/api', match[1])
      const { get, post, put, del }: API = await this._import({ api: path })
      if (get) this.router.get(route, get)
      if (post) this.router.post(route, post)
      if (put) this.router.put(route, put)
      if (del) this.router.delete(route, del)
    }
  }

  private async _setupPages() {
    for (const path of await fs.readdir(Path.PAGES, { recursive: true })) {
      const match = path.match(re.html)
      if (!match) continue

      const route = this._makeRoute('/', match[1])

      this.router.get(route, async (c) => {
        // const page = await open(`${Path.PAGES}/${path}`)
        // return c.html(page)
        // const page = await this.ssr.renderRoot(path)
        const content = await open(join(Path.PAGES, path))
        const page = await this.ssr.render(content)
        return c.html(page)
      })
    }
  }

  private async _setupBrowser() {
    for (const path of await readdir(Path.BROWSER, true)) {
      if (!path.isFile()) continue

      const match = path.name.match(re.js)
      if (!match) continue

      console.log(path.name)

      const route = join('/@', path.name)
      console.log(route)

      this.router.get(route, async (c) => {
        const file = Bun.file(join(Path.BROWSER, path.name))
        let content = await file.text()

        if (path.name.endsWith('ts')) {
          content = transpile(content)
        }

        c.header('content-type', file.type)
        return c.body(content)
      })
    }
  }

  private async _import(
    path: string | Partial<Record<Lowercase<keyof typeof Path>, string>>,
  ) {
    if (typeof path === 'string') {
      path = `../app/${path}`
    } else {
      const [key, file] = Object.entries(path)[0]
      path = `../${Path[key.toUpperCase() as keyof typeof Path]}/${file}`
    }

    const mod = await import(path)
    // TODO: add some error handling
    return mod
  }

  private _makeRoute(prefix: string, path: string) {
    const endpoint = path.replace(re.index, '')
    return join(prefix, endpoint)
  }
}

if (import.meta.main) {
  const app = new Lite()
  await app.init()

  Bun.serve({
    port: 6969,
    fetch: app.router.fetch,
    websocket: app.io.websocket,
  })
}

// export default {
//   port: 6969,
//   fetch: app.router.fetch,
//   websocket: app.io.websocket,
// }
