import fs from 'node:fs/promises'
import p from 'node:path'

// get all the entries at the browser dir which are a file

const browserDir = './app/browser'

const dir = (path: string) => p.resolve(browserDir, path)

const browser = (path: string) => p.resolve(browserDir, path)

// console.log(dir('index.mjs'))

// const files = await fs.readdir(browserDir, {
//   withFileTypes: true,
//   recursive: true,
//   encoding: 'utf-8',
// })

// const entries = files
//   .filter((f) => f.isFile())
//   .map((f) => p.join(browserDir, f.name))

// console.log(entries)

const dev = true

export async function build(entrypoints: string[]) {
  const result = await Bun.build({
    entrypoints,
    outdir: './pub/b',
    // naming: `[dir]/${dev ? 'bundle' : 'bundle.min'}.[ext]`,
    minify: !dev,
    // splitting: true,
    // publicPath: '/pub/b/',
  })

  if (!result.success) {
    throw new AggregateError(result.logs, 'Build failed')
  }
}

// await build([dir('index.mjs'), dir('other.ts')])

declare global {
  var count: number
}

/* global.count ??= 0
console.log(`Reloaded ${globalThis.count} times`)
global.count++

Bun.serve({
  fetch(req) {
    return new Response(`Reloaded ${globalThis.count} times`)
  },
}) */
