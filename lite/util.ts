import fs from 'node:fs/promises'

export function open(
  path: string,
  mode: 'text' | 'json' | 'arrayBuffer' = 'text',
) {
  return Bun.file(path)[mode]()
}

export function readdir(path: string, recursive = false) {
  return fs.readdir(path, { recursive, withFileTypes: true })
}
