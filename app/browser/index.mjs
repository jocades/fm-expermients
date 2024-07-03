import { shared } from './shared'
import { SocketClient } from 'pcall/ws/client'

console.log(shared)

const ws = new SocketClient('ws://localhost:6969/ws')

ws.on('connect', () => {
  console.log('Connected')

  ws.on('reload', () => {
    location.reload()
  })
})
