import { WebSocket } from 'pcall/ws'

const ws = new WebSocket('ws://localhost:6969/ws')

ws.on('connect', () => {
  console.log('Connected')

  ws.on('reload', () => {
    console.log('Reloading')
    location.reload()
  })
})
