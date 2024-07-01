import type { Context } from 'hono'

export function get(c: Context) {
  console.log('executing get for /books')
  return c.json({ books: [] })
}
