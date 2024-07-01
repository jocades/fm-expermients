import { useState } from 'preact/hooks'

interface HeadProps {
  title: string
}

const items = [1, 2, 3]

export default function Head({ title }: HeadProps) {
  return (
    <html lang="en">
      <head>
        <title>{title}</title>
      </head>
      <body>
        <ul>
          {items.map((item) => (
            <li>{item}</li>
          ))}
        </ul>
      </body>
    </html>
  )
}

const Counter = (initCount: number) => {
  const [count, setCount] = useState(initCount)
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

/* const html = render(<Head title="test" />)
console.log(html)

const vnode = render(h(Head, { title: 'test' }))
console.log(vnode) */
