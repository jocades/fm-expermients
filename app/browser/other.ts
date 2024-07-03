import { SocketClient } from 'pcall/ws/client'
import { shared } from './shared.mjs'

console.log(shared)

const ws = new SocketClient('ws://localhost:6969/ws')
