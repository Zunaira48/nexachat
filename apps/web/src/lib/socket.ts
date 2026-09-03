import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  socket = io(API_URL, {
    auth: { token },
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}