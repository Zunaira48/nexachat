import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens';
import { assertConversationMember } from '../services/authorization.service';
import { env } from '../config/env';

let ioInstance: Server | undefined;

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // Every socket must present a valid access token before the
  // connection is accepted — same trust boundary as REST, just
  // enforced at handshake time instead of per-request.
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
    socket.on(
      'join_conversation',
      async (conversationId: string, callback?: (res: { ok: boolean; error?: string }) => void) => {
        try {
          await assertConversationMember(conversationId, socket.data.userId);
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

    // Presence (online/offline) is Phase 11 — this connection handler
    // deliberately does nothing more than auth + room membership for now.
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