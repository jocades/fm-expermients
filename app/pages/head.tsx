import { render } from 'preact-render-to-string'

export default function Head() {
  return <button>Hello</button>
  /* return `
    <html lang="en">
    <head>
      <title>${path}</title>
    </head>
    <body>
` */
}

const str = render(<Head />)

console.log(str)
