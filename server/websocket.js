import { WebSocket, WebSocketServer } from 'ws';

export function createWebSocketHub(server) {
  const wss = new WebSocketServer({ server, path: '/events' });

  wss.on('connection', (socket) => {
    console.log('[WS] Jogo conectado.');

    socket.on('close', () => {
      console.log('[WS] Jogo desconectado.');
    });
  });

  return {
    broadcast(event) {
      const payload = JSON.stringify(event);
      let delivered = 0;

      for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) {
          continue;
        }

        client.send(payload);
        delivered += 1;
      }

      return delivered;
    },

    close() {
      wss.close();
    }
  };
}
