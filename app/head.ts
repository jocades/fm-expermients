import type { Context } from 'hono'

const cache = new WeakMap<TemplateStringsArray, string>()

function html(strings: TemplateStringsArray, ...values: string[]) {
  if (cache.has(strings)) {
    console.log('cache hit')
    return cache.get(strings)
  }

  let str = strings[0]
  for (let i = 0; i < values.length; i++) {
    str += values[i] + strings[i + 1]
  }

  cache.set(strings, str)
  return str
}

export default function Head(c: Context) {
  return html`
    <html lang="en">
      <head>
        <title>${c.req.path}</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
        </style>
      </head>
    </html>
  `
}
