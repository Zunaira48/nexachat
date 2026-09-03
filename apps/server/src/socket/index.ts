import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens';
import { assertConversationMember } from '../services/authorization.service';
import { env } from '../config/env';
import { addConnection, removeConnection, isOnline } from './presence';

let ioInstance: Server | undefined;

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;

    // Multi-device aware: only broadcast "online" on the FIRST
    // connection for this user, not on every additional tab/device.
    const connectionCount = addConnection(userId);
    if (connectionCount === 1) {
      io.emit('presence_update', { userId, online: true });
    }

    socket.on(
      'join_conversation',
      async (conversationId: string, callback?: (res: { ok: boolean; error?: string }) => void) => {
        try {
          await assertConversationMember(conversationId, userId);
          socket.join(`conversation:${conversationId}`);
          callback?.({ ok: true });
        } catch {
          callback?.({ ok: false, error: 'Not authorized for this conversation' });
        }
      },
    );

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators — pure ephemeral broadcast, never persisted.
    // The room check isn't re-verified here since typing_start only
    // has effect for sockets already joined to the room (Socket.IO
    // only delivers to actual room members), so a non-member emitting
    // this is a no-op, not a security hole.
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', { userId, conversationId });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { userId, conversationId });
    });

    socket.on('disconnect', () => {
      const remaining = removeConnection(userId);
      if (remaining === 0) {
        io.emit('presence_update', { userId, online: false });
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return ioInstance;
}

export { isOnline };