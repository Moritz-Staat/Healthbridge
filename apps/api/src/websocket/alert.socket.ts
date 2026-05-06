import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { Alert } from '@healthbridge/shared-types'

let io: SocketIOServer

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: { origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true },
  })

  io.on('connection', (socket) => {
    socket.on('join', (room: string) => {
      socket.join(room)
    })
    socket.on('leave', (room: string) => {
      socket.leave(room)
    })
  })

  return io
}

export function emitAlert(patientId: string, alert: Alert) {
  if (!io) return
  io.to(`patient:${patientId}`).emit('alert:new', alert)
  io.to(`family:${patientId}`).emit('alert:new', alert)
}

export { io }
