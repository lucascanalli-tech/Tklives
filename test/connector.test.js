import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { TikTokConnector } from "../server/tiktok/TikTokConnector.js";
import { WebSocketEventSource } from "../game/events/WebSocketEventSource.js";
import { EventBus } from "../game/events/EventBus.js";
const tick = () => new Promise((resolve) => setImmediate(resolve));
const logger = { info() {}, warn() {}, error() {} };
function fixture(outcomes = [true]) {
  const connections = [];
  const timers = [];
  const states = [];
  const events = [];
  let index = 0;
  const connector = new TikTokConnector({
    username: "@host",
    onEvent: (e) => events.push(e),
    onStatus: (s) => states.push(s),
    logger,
    random: () => 0,
    schedule: (fn, delay) => {
      const timer = { fn, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    cancel: (t) => {
      t.cancelled = true;
    },
    connectionFactory: () => {
      const connection = new EventEmitter();
      connections.push(connection);
      const outcome = outcomes[index++] ?? true;
      connection.connect = async () => {
        if (outcome instanceof Error) throw outcome;
        return { roomId: "room-1" };
      };
      connection.disconnect = async () => {};
      return connection;
    },
  });
  return { connector, connections, timers, states, events };
}
test("concurrent connect calls share a single connection; disconnected transport reconnects", async () => {
  const f = fixture();
  const first = f.connector.connect();
  assert.equal(f.connector.connect(), first);
  await first;
  assert.equal(f.connections.length, 1);
  assert.equal(f.connector.state, "CONNECTED");
  f.connections[0].emit("chat", {
    user: { userId: "1", uniqueId: "viewer" },
    comment: "oi",
  });
  assert.equal(f.events[0].data.message, "oi");
  f.connections[0].emit("disconnected", {});
  assert.equal(f.timers.length, 1);
  assert.equal(f.timers[0].delay, 1000);
  f.timers[0].fn();
  await tick();
  assert.equal(f.connections.length, 2);
  assert.equal(f.connector.state, "CONNECTED");
  f.connections[0].emit("chat", {
    user: { userId: "stale", uniqueId: "viewer" },
    comment: "late",
  });
  assert.equal(f.events.length, 1);
  await f.connector.disconnect();
  assert.equal(f.connector.state, "DISCONNECTED");
});
test("initial failures back off and shutdown cancels retry without crashing", async () => {
  const f = fixture([new Error("offline"), new Error("offline"), true]);
  await f.connector.connect();
  assert.ok(f.states.some((s) => s.state === "ERROR"));
  assert.equal(f.timers[0].delay, 1000);
  f.timers[0].fn();
  await tick();
  assert.equal(f.timers[1].delay, 2000);
  f.timers[1].fn();
  await tick();
  assert.equal(f.connector.state, "CONNECTED");
  f.connections[2].emit("disconnected", {});
  const last = f.timers.at(-1);
  await f.connector.disconnect();
  assert.equal(last.cancelled, true);
  last.fn();
  await tick();
  assert.equal(f.connections.length, 3);
});
test("stopping an in-flight connection cannot publish a late CONNECTED status", async () => {
  let resolve;
  const raw = new EventEmitter();
  raw.connect = () =>
    new Promise((r) => {
      resolve = r;
    });
  raw.disconnect = async () => {};
  const states = [];
  const c = new TikTokConnector({
    username: "host",
    onEvent() {},
    onStatus: (s) => states.push(s),
    logger,
    connectionFactory: () => raw,
  });
  const pending = c.connect();
  await tick();
  await c.disconnect();
  resolve({ roomId: "late" });
  await pending;
  assert.equal(c.state, "DISCONNECTED");
  assert.ok(!states.some((s) => s.state === "CONNECTED"));
});
class FakeSocket extends EventTarget {
  constructor() {
    super();
    this.readyState = 0;
  }
  emit(type, data) {
    const event = new Event(type);
    if (data !== undefined) event.data = data;
    this.dispatchEvent(event);
  }
  close() {
    this.readyState = 3;
    this.emit("close");
  }
}
test("browser transport reconnects, forwards first interaction, and stop cancels retries", () => {
  const sockets = [];
  const timers = [];
  const statuses = [];
  const received = [];
  const bus = new EventBus();
  bus.subscribe((e) => received.push(e));
  const source = new WebSocketEventSource(bus, "ws://test/events", {
    onStatus: (s) => statuses.push(s),
    createSocket: () => {
      const s = new FakeSocket();
      sockets.push(s);
      return s;
    },
    schedule: (fn, delay) => {
      const t = { fn, delay };
      timers.push(t);
      return t;
    },
    cancel: (t) => {
      t.cancelled = true;
    },
  });
  source.start();
  source.start();
  assert.equal(sockets.length, 1);
  sockets[0].emit("open");
  sockets[0].emit(
    "message",
    JSON.stringify({ type: "STATUS", data: { state: "CONNECTED" } }),
  );
  sockets[0].emit(
    "message",
    JSON.stringify({
      type: "COMMENT",
      userId: "1",
      username: "viewer",
      data: { message: "oi" },
    }),
  );
  assert.equal(received.length, 1);
  assert.equal(received[0].type, "COMMENT");
  sockets[0].close();
  assert.equal(timers[0].delay, 500);
  timers[0].fn();
  assert.equal(sockets.length, 2);
  sockets[1].close();
  source.stop();
  assert.equal(timers[1].cancelled, true);
  timers[1].fn();
  assert.equal(sockets.length, 2);
  assert.ok(statuses.some((s) => s.transport === "RECONNECTING"));
  bus.destroy();
});

test("disconnect during connection setup cannot consume the next retry", async () => {
  let completeOld;
  const raw = new EventEmitter();
  raw.connect = () =>
    new Promise((resolve) => {
      completeOld = resolve;
    });
  raw.disconnect = async () => {};
  const newer = new EventEmitter();
  newer.connect = async () => ({ roomId: "new-room" });
  newer.disconnect = async () => {};
  let calls = 0;
  const timers = [];
  const connector = new TikTokConnector({
    username: "host",
    onEvent() {},
    logger,
    random: () => 0,
    connectionFactory: () => (calls++ ? newer : raw),
    schedule: (fn, delay) => {
      const timer = { fn, delay };
      timers.push(timer);
      return timer;
    },
    cancel() {},
  });
  const old = connector.connect();
  await tick();
  raw.emit("disconnected");
  timers[0].fn();
  await tick();
  assert.equal(calls, 2);
  assert.equal(connector.state, "CONNECTED");
  completeOld({ roomId: "old-room" });
  await old;
  assert.equal(connector.connection, newer);
  assert.equal(connector.state, "CONNECTED");
  await connector.disconnect();
});
