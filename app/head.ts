import type { Context } from 'hono'

export default function Head(c: Context) {
  return `
    <html lang="en">
    <head>
      <title>${c.req.path}</title>
    </head>
    <body>
`
}
