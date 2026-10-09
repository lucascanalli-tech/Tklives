import {
  ControlEvent,
  TikTokLiveConnection,
  WebcastEvent,
} from "tiktok-live-connector";
import { mapTikTokEvent } from "./TikTokEventMapper.js";
const bindings = [
  [WebcastEvent.MEMBER, "JOIN"],
  [WebcastEvent.CHAT, "COMMENT"],
  [WebcastEvent.LIKE, "LIKE"],
  [WebcastEvent.FOLLOW, "FOLLOW"],
  [WebcastEvent.GIFT, "GIFT"],
  [WebcastEvent.SHARE, "SHARE"],
];
// Replaceable adapter: connect(), disconnect(), onEvent(event), onStatus(publicState).
export class TikTokConnector {
  constructor({
    username,
    onEvent,
    onStatus = () => {},
    connectionFactory,
    schedule = setTimeout,
    cancel = clearTimeout,
    random = Math.random,
    logger = console,
    options = {},
  }) {
    this.username = String(username ?? "")
      .trim()
      .replace(/^@+/, "");
    this.onEvent = onEvent;
    this.onStatus = onStatus;
    this.factory =
      connectionFactory ??
      ((name, config) => new TikTokLiveConnection(name, config));
    this.schedule = schedule;
    this.cancel = cancel;
    this.random = random;
    this.logger = logger;
    this.options = options;
    this.connection = null;
    this.pending = null;
    this.retryTimer = null;
    this.attempt = 0;
    this.stopped = false;
    this.generation = 0;
    this.state = "DISCONNECTED";
  }
  setState(state, details = {}) {
    this.state = state;
    this.onStatus({ state, username: `@${this.username}`, ...details });
    this.logger.info(
      `[TIKTOK] ${state}${details.retryInMs ? ` (${details.retryInMs} ms)` : ""}`,
    );
  }
  connect() {
    if (this.pending) return this.pending;
    if (this.state === "CONNECTED") return Promise.resolve();
    if (!this.username)
      return Promise.reject(new Error("TIKTOK_USERNAME não foi informado."));
    this.stopped = false;
    if (this.retryTimer) this.cancel(this.retryTimer);
    this.retryTimer = null;
    const generation = ++this.generation;
    this.setState(this.attempt ? "RECONNECTING" : "CONNECTING");
    const pending = Promise.resolve()
      .then(() => this.open(generation))
      .finally(() => {
        if (this.pending === pending) this.pending = null;
      });
    this.pending = pending;
    return pending;
  }
  async open(generation) {
    let connection;
    try {
      if (this.stopped || generation !== this.generation) return;
      connection = this.factory(this.username, {
        processInitialData: false,
        fetchRoomInfoOnConnect: true,
        enableExtendedGiftInfo: true,
        ...this.options,
      });
      this.connection = connection;
      const current = () =>
        !this.stopped &&
        generation === this.generation &&
        this.connection === connection;
      bindings.forEach(([external, internal]) =>
        connection.on(external, (raw) => {
          if (!current()) return;
          const event = mapTikTokEvent(internal, raw);
          if (!event) return;
          this.onEvent(event);
          if (event.type === "COMMENT")
            this.logger.info(
              `[TIKTOK] Comment ${event.username} ${JSON.stringify(event.data.message)}`,
            );
          if (
            event.type === "GIFT" &&
            (event.data.giftType !== 1 || event.data.repeatEnd)
          ) {
            this.logger.info(
              `[TIKTOK] Gift ${event.username} ${event.data.giftName} (${event.data.giftId}) x${event.data.quantity}`,
            );
          }
        }),
      );
      connection.on(ControlEvent.DISCONNECTED, () => {
        if (!current()) return;
        this.generation += 1;
        this.pending = null;
        this.connection = null;
        void this.release(connection);
        this.setState("DISCONNECTED");
        this.reconnect();
      });
      connection.on(WebcastEvent.STREAM_END, () => {
        if (!current()) return;
        this.generation += 1;
        this.pending = null;
        this.setState("DISCONNECTED", {
          reason: "LIVE encerrada; aguardando nova LIVE.",
        });
        this.connection = null;
        void this.release(connection);
        this.reconnect();
      });
      connection.on(ControlEvent.ERROR, (error) => {
        if (!current()) return;
        this.logger.warn(
          `[TIKTOK] ERROR: ${error?.info ?? error?.exception?.message ?? "falha de transporte"}`,
        );
      });
      const result = await connection.connect();
      if (!current()) {
        await this.release(connection);
        return;
      }
      this.attempt = 0;
      this.setState("CONNECTED", { roomId: String(result?.roomId ?? "") });
    } catch (error) {
      if (this.stopped || generation !== this.generation) return;
      await this.release(connection);
      this.connection = null;
      const nested = [
        ...(Array.isArray(error?.requestErrs) ? error.requestErrs : []),
        ...(Array.isArray(error?.errors) ? error.errors : []),
        error?.cause,
      ].filter(Boolean);
      this.logger.error(
        `[TIKTOK] ERROR: ${error?.message ?? "Falha ao conectar"}`,
      );
      nested.forEach((item) =>
        this.logger.error(`[TIKTOK][DIAG] ${item?.message ?? String(item)}`),
      );
      this.setState("ERROR", {
        reason: "Não foi possível conectar à LIVE. Consulte o terminal.",
      });
      this.reconnect();
    }
  }
  reconnect() {
    if (this.stopped || this.retryTimer) return;
    const delay =
      Math.min(60000, 1000 * 2 ** Math.min(this.attempt++, 6)) +
      Math.floor(this.random() * 500);
    this.setState("RECONNECTING", { retryInMs: delay });
    this.retryTimer = this.schedule(() => {
      this.retryTimer = null;
      if (!this.stopped) void this.connect();
    }, delay);
  }
  async disconnect() {
    this.stopped = true;
    this.generation += 1;
    this.pending = null;
    if (this.retryTimer) this.cancel(this.retryTimer);
    this.retryTimer = null;
    const connection = this.connection;
    this.connection = null;
    await this.release(connection);
    this.setState("DISCONNECTED");
  }

  async release(connection) {
    if (!connection) return;
    connection.removeAllListeners();
    // An adapter may emit an error while shutting down its transport.
    connection.on(ControlEvent.ERROR, () => {});
    try {
      await connection.disconnect();
    } catch {
      /* Already disconnected. */
    }
  }
}
