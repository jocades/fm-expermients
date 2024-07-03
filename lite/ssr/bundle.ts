const dev = true

export async function build(entrypoints: string[]) {
  const result = await Bun.build({
    entrypoints,
    outdir: './pub/b',
    // naming: `[dir]/${dev ? 'bundle' : 'bundle.min'}.[ext]`,
    minify: !dev,
  })

  if (!result.success) {
    for (const message of result.logs) {
      console.error(message)
    }
    throw new Error('Build failed')
  }
}

await build(['app/browser/index.mjs'])
