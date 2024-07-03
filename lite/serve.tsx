import fs from 'node:fs/promises'
import { Hono, type Context } from 'hono'
import { logger } from 'hono/logger'
import { Path, type API_METHODS } from './consts'
import type { AnyFn, AnyObject, MaybePromise } from './types'
import { SocketServer } from 'pcall/ws/server'
import { open, readdir } from './util'
import { join, resolve } from 'node:path'
import { SSREngine } from './ssr'
import { transpile } from 'typescript'
import { watch } from 'chokidar'
import { build } from './ssr/bundle'
import type { FC } from 'hono/jsx'

const pagesRouter = new Bun.FileSystemRouter({
  style: 'nextjs',
  dir: 'app/pages',
  fileExtensions: ['.html', '.tsx', '.jsx'],
})

const apiRouter = new Bun.FileSystemRouter({
  style: 'nextjs',
  dir: 'app/api',
  fileExtensions: ['.ts', '.js', '.mjs'],
})

// console.log(apiRouter.match('/'))

function removeTrailingSlash(url: string) {
  return url.replace(/\/$/, '')
}

// console.log(fsRouter.match('/')) // mathes index.html
//
// console.log(fsRouter.match('/index.html')) // no match
// console.log(fsRouter.match('/about?foo=bar'))

type APIMethod = (typeof API_METHODS)[number]

namespace Mod {
  export type API = Partial<
    Record<APIMethod, (c: Context) => MaybePromise<Response>>
  >

  export interface Page {
    default: FC
    loader?: (c: Context) => Promise<AnyObject>
  }
}

// type API = Partial<Record<APIMethod, (c: Context) => MaybePromise<Response>>>

const re = {
  js: /^(.+)\.(ts|js|mjs)$/,
  jsx: /^(.+)\.(tsx|jsx)$/,
  html: /^(.+)\.html$/,
  index: /\/?index$/,
  htmljsx: /^(.+)\.(html|tsx|jsx)$/,
}

function serveStatic() {
  return async (c: Context) => {
    const file = Bun.file('.' + c.req.path)
    if (!(await file.exists())) {
      return c.notFound()
    }
    c.header('content-type', file.type)
    return c.body(await file.arrayBuffer())
  }
}

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props: { title: string }): Response
  }
}

// cache for page components
const cache = new Map<string, Mod.Page>()

let count = 0

class Lite {
  router = new Hono()
  io = new SocketServer()
  ssr = new SSREngine()

  private _dev = false

  constructor() {
    this.router.use(logger())
    this.router.get('/ping', (c) => c.text('pong'))
  }

  async init() {
    await this._setup()
  }

  async initDev() {
    this._dev = true
    await this._setup()
    await this._watch()
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

    await this._setupSocket()
  }

  private async _setupPub() {
    this.router.get('/pub/*', serveStatic())
  }

  private async _setupAPI() {
    if (this._dev) {
      this.router.all('/api/*', async (c) => {
        // remove the '/api' prefix
        const match = apiRouter.match(c.req.path.slice(4))
        if (!match) return c.notFound()

        const mod: Mod.API = await this._import('api', match.src)
        const method =
          c.req.method === 'DELETE'
            ? 'del'
            : (c.req.method.toLowerCase() as APIMethod)

        if (!mod[method]) return c.notFound()
        return mod[method](c)
      })
    }
  }

  private async _setupPages() {
    if (this._dev) {
      const watcher = watch(Path.PAGES)
      watcher
        .on('add', () => pagesRouter.reload())
        .on('unlink', () => pagesRouter.reload())
        .on('change', (path) => {
          cache.delete(path)
          this.io.emit('reload')
        })

      this.router.get('*', async (c) => {
        const route = pagesRouter.match(c.req.path)
        if (!route) return c.notFound()

        // console.log(route)
        count++
        console.log(count, route.src)

        if (route.src.match(re.html)) {
          const content = await open(route.filePath)
          return c.html(content)
        }

        if (route.src.match(re.jsx)) {
          if (cache.has(route.src)) {
            console.log('cache hit')
            const mod = cache.get(route.src)!
            return c.html(this._render(c, mod))
          }
          const mod = await this._import<Mod.Page>('pages', route.src)
          if (!mod.default) return c.notFound()
          cache.set(route.src, mod)
          return c.html(this._render(c, mod))
        }
      })
    }

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

  private async _render(c: Context, mod: Mod.Page) {
    const data = mod.loader ? await mod.loader(c) : {}
    return <mod.default {...data} />
  }

  private async _setupBrowser() {
    if (this._dev) {
      const watcher = watch(Path.BROWSER)

      watcher.on('change', async (path) => {
        console.log('Building', path)
        try {
          await build([path])
          this.io.emit('reload')
        } catch (err) {
          console.error(err)
        }
      })
      return
    }

    /* if (this._dev) {
      this.router.get('/@*', async (c) => {
        // return the contents from 'pub/b' folder
        const file = Bun.file('.' + c.req.url)
        if (!(await file.exists())) {
          return c.notFound()
        }
        c.header('content-type', file.type)
        return c.body(await file.arrayBuffer())
      })
    } */

    for (const path of await readdir(Path.BROWSER, true)) {
      if (!path.isFile()) continue

      const match = path.name.match(re.js)
      if (!match) continue

      // console.log(path.name)

      const route = join('/@', path.name)
      // console.log(route)

      this.router.get(route, async (c) => {
        const file = Bun.file(join(Path.BROWSER, path.name))
        let content = await file.text()

        if (path.name.endsWith('ts')) {
          content = transpile(content)
          // 'test.ts' -> 'test.b.js' in same dir
          // call sync so that we respond and dont wait for the file to be written
          Bun.write(
            join(Path.BROWSER, path.name.replace(/\.ts$/, '.b.js')),
            content,
          )
        }

        c.header('content-type', file.type)
        return c.body(content)
      })
    }
  }

  private async _setupSocket() {
    this.io.on('connection', (socket) => {
      socket.on('disconnect', () => {})
    })
  }

  // file wather for dev
  private async _watch() {
    // use chokidar
    /* const watcher = chokidar.watch([Path.PAGES, Path.BROWSER])

    watcher.on('change', (path) => {
      console.log(path)
      this.io.emit('reload')
    }) */
    /* const watcher = watch(Path.PAGES, {
      recursive: true,
    })

    watcher.on(
      'change',
      debounce(async (event, path) => {
        console.log(event, path)
        this.io.emit('reload')
      }),
    ) */
  }

  private async _import<T>(dir: Lowercase<keyof typeof Path>, file: string) {
    const mod = await import(
      resolve(Path[dir.toUpperCase() as keyof typeof Path], file)
    )
    // TODO: add some error handling
    return mod as T
  }

  private _makeRoute(prefix: string, path: string) {
    const endpoint = path.replace(re.index, '')
    return join(prefix, endpoint)
  }

  // server setup
  // export default lite -> initialize bun server
  /* port = 6969

  fetch = (req: Request, server: Server) => {
    const { pathname } = new URL(req.url)
    if (pathname === '/ws') {
      if (server.upgrade(req, { data: { id: 1 } })) return
      return new Response('Upgrade failed', { status: 500 })
    }
    return this.router.fetch(req)
  }

  websocket = this.io.websocket */

  serve() {
    const server = Bun.serve({
      port: 6969,
      async fetch(req, serv) {
        const { pathname } = new URL(req.url)
        if (pathname === '/ws') {
          if (serv.upgrade(req, { data: { id: 1 } })) return
          return new Response('Upgrade failed', { status: 500 })
        }
        return lite.router.fetch(req)
      },
      websocket: lite.io.websocket,
    })

    console.log(`🔥Listening at ${removeTrailingSlash(server.url.href)}`)
  }
}

/* if (import.meta.main) {
  const lite = new Lite()
  await lite.initDev()

  Bun.serve({
    port: 6969,
    async fetch(req, serv) {
      const { pathname } = new URL(req.url)
      if (pathname === '/ws') {
        if (serv.upgrade(req, { data: { id: 1 } })) return
        return new Response('Upgrade failed', { status: 500 })
      }
      return lite.router.fetch(req)
    },
    websocket: lite.io.websocket,
  })
} */

const lite = new Lite()
await lite.initDev()

lite.serve()

// export default lite

// lite.serve()
// export default {
//   port: 6969,
//   fetch: lite.router.fetch,
//   websocket: lite.io.websocket,
// }
