import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocket } from './socket';

const app = createApp();
const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
});