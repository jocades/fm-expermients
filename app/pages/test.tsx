import type { Context } from 'hono'
import type { Use } from '../../lite/types'

export async function loader(c: Context) {
  const name = c.req.query('name') ?? 'World'
  return { name }
}

export default (data: Use<typeof loader>) => {
  return (
    <html>
      <head>
        <title>Home</title>
      </head>
      <body>
        <h1>Hello {data.name}!</h1>
        <Component />
      </body>
    </html>
  )
}

function Component() {
  return <h1>Component</h1>
}
