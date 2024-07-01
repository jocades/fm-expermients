import { render } from 'preact-render-to-string'

interface HeadProps {
  title: string
}

export default function Head({ title, children }: HeadProps) {
  return (
    <html lang="en">
      <head>
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  )
}

export function Child() {
  return <div>Hello World</div>
}

const html = render(<Head title="test" />)

console.log(html)
