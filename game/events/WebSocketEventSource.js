export class WebSocketEventSource {
  constructor(
    eventBus,
    url = null,
    {
      onStatus = () => {},
      createSocket = (value) => new WebSocket(value),
      schedule = setTimeout,
      cancel = clearTimeout,
    } = {},
  ) {
    this.eventBus = eventBus;
    this.url =
      url ??
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/events`;
    this.onStatus = onStatus;
    this.createSocket = createSocket;
    this.schedule = schedule;
    this.cancel = cancel;
    this.socket = null;
    this.retryTimer = null;
    this.attempt = 0;
    this.running = false;
  }
  start() {
    this.running = true;
    if (this.socket || this.retryTimer) return;
    this.open();
  }
  open() {
    if (!this.running) return;
    this.onStatus({ transport: this.attempt ? "RECONNECTING" : "CONNECTING" });
    let socket;
    try {
      socket = this.createSocket(this.url);
    } catch {
      this.retry();
      return;
    }
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (socket !== this.socket) return;
      this.attempt = 0;
      this.onStatus({ transport: "CONNECTED" });
    });
    socket.addEventListener("message", (message) => {
      if (
        socket !== this.socket ||
        typeof message.data !== "string" ||
        message.data.length > 16384
      )
        return;
      try {
        const event = JSON.parse(message.data);
        if (event?.type === "STATUS") {
          this.onStatus({ ...event.data, transport: "CONNECTED" });
        } else this.eventBus.publish(event);
      } catch {
        console.warn("[WS] Mensagem inválida ignorada.");
      }
    });
    socket.addEventListener("close", () => {
      if (socket !== this.socket) return;
      this.socket = null;
      if (this.running) this.retry();
    });
    socket.addEventListener("error", () => {
      if (socket === this.socket) socket.close();
    });
  }
  retry() {
    if (!this.running || this.retryTimer) return;
    const delay = Math.min(15000, 500 * 2 ** Math.min(this.attempt++, 5));
    this.onStatus({ transport: "RECONNECTING", retryInMs: delay });
    this.retryTimer = this.schedule(() => {
      this.retryTimer = null;
      this.open();
    }, delay);
  }
  publish(event) {
    return this.eventBus.publish(event);
  }
  stop() {
    this.running = false;
    if (this.retryTimer) this.cancel(this.retryTimer);
    this.retryTimer = null;
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }
}
