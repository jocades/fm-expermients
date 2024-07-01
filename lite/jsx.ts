import { h } from 'preact'
import { render } from 'preact-render-to-string'

const mod = await import('../app/head-x')

const vnode = h(mod.default, { title: 'test' })
console.log(vnode)

const html = render(vnode)
console.log(html)
