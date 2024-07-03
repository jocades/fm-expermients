import { Hono } from 'hono'
// import { render } from 'preact-render-to-string'

const router = new Hono()

router.get('*', async (c) => {
  const { default: Page, loader } = await import('./loader')
  return c.html(<Page {...loader(c)} />)
})

// transpile this file
// const content = transpile(await open(import.meta.url))

export default router

function match(path: string) {}
