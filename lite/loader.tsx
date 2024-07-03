import type { Context } from 'hono'
import type { Use } from './types'

export function loader(c: Context) {
  console.log(c.req.path)
  return { name: 'Jordi' }
}

export default function Page(data: Use<typeof loader>) {
  return (
    <html>
      <head>
        <title>Home</title>
      </head>
      <body>
        <h1>Hello {data.name}</h1>
        <Component />
      </body>
    </html>
  )
}

function Component() {
  return <h1>Component</h1>
}
