export function open(
  path: string,
  mode: 'text' | 'json' | 'arrayBuffer' = 'text',
) {
  return Bun.file(path)[mode]()
}
