export function open(path: string) {
  return Bun.file(path).text()
}
