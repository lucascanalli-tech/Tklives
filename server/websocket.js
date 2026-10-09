import { WebSocket, WebSocketServer } from "ws";
export function createWebSocketHub(server, getStatus = () => ({})) {
  const wss = new WebSocketServer({
    server,
    path: "/events",
    maxPayload: 4096,
  });
  wss.on("connection", (socket) => {
    socket.alive = true;
    socket.on("error", () => socket.terminate());
    socket.on("pong", () => {
      socket.alive = true;
    });
    socket.send(JSON.stringify({ type: "STATUS", data: getStatus() }));
  });
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.alive) {
        socket.terminate();
        continue;
      }
      socket.alive = false;
      socket.ping();
    }
  }, 30000);
  heartbeat.unref();
  return {
    broadcast(event) {
      const payload = JSON.stringify(event);
      let delivered = 0;
      for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;
        if (client.bufferedAmount > 1024 * 1024) {
          client.terminate();
          continue;
        }
        client.send(payload);
        delivered += 1;
      }
      return delivered;
    },
    close() {
      clearInterval(heartbeat);
      for (const client of wss.clients) client.terminate();
      wss.close();
    },
  };
}
