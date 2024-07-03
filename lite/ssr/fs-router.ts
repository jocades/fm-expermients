const fsRouter = new Bun.FileSystemRouter({
  style: 'nextjs',
  dir: 'app/pages',
  origin: 'http://localhost:8000',
  assetPrefix: '/@',
  fileExtensions: ['.html'],
})

console.log(fsRouter.match('/')) // mathes index.html

console.log(fsRouter.match('/index.html')) // no match
console.log(fsRouter.match('/about?foo=bar'))
