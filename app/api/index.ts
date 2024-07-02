import type { Context } from 'hono'

export function get(c: Context) {
  console.log('executing get for /api')
  return c.text('GET /api')
}

export function post(c: Context) {
  console.log('executing post for /api')
  return c.text('POST /api')
}

export function put(c: Context) {
  console.log('executing put for /api')
  return c.text('PUT /api')
}

export function del(c: Context) {
  console.log('executing del for /api')
  return c.text('DELETE /api')
}
