import fs from 'node:fs/promises'
import type { AnyFn } from './types'

export function open(
  path: string,
  mode: 'text' | 'json' | 'arrayBuffer' = 'text',
) {
  return Bun.file(path)[mode]()
}

export function readdir(path: string, recursive = false) {
  return fs.readdir(path, { recursive, withFileTypes: true })
}

export function debounce(fn: AnyFn<void>) {
  let timeout: Timer
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), 100)
  }
}
