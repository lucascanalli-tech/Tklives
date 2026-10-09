export class WebSocketEventSource {
  constructor(eventBus, url = null) {
    this.eventBus = eventBus;
    this.url = url ?? this.getDefaultUrl();
    this.socket = null;
    this.seenUsers = new Set();
  }

  getDefaultUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/events`;
  }

  start() {
    if (this.socket) {
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.addEventListener('open', () => {
      console.info('[WS] Live Arena conectada ao backend.');
    });

    this.socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(message.data);
        this.publish(event);
      } catch (error) {
        console.warn('[WS] Evento inválido ignorado.', error);
      }
    });

    this.socket.addEventListener('close', () => {
      console.warn('[WS] Backend desconectado.');
      this.socket = null;
    });

    this.socket.addEventListener('error', () => {
      console.warn('[WS] Falha na conexão com o backend.');
    });
  }

  publish(event) {
    const userId = String(event?.userId ?? '').trim();

    if (!userId) {
      return;
    }

    if (!this.seenUsers.has(userId) && event.type !== 'JOIN') {
      this.eventBus.publish({
        type: 'JOIN',
        userId,
        username: event.username,
        timestamp: event.timestamp
      });
      this.seenUsers.add(userId);
    }

    if (this.eventBus.publish(event) && event.type === 'JOIN') {
      this.seenUsers.add(userId);
    }
  }

  stop() {
    this.socket?.close();
    this.socket = null;
    this.seenUsers.clear();
  }
}
