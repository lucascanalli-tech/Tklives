export const EVENT_TYPES = Object.freeze([
  'JOIN',
  'COMMENT',
  'LIKE',
  'FOLLOW',
  'GIFT',
  'SHARE'
]);

const SUPPORTED_EVENTS = new Set(EVENT_TYPES);

function normalizeUsername(username) {
  const value = String(username ?? '').trim();
  return value.startsWith('@') ? value : `@${value}`;
}

export class EventBus {
  constructor() {
    this.listeners = new Set();
    this.typeListeners = new Map();
  }

  publish(event) {
    const type = String(event?.type ?? '').toUpperCase();
    const userId = String(event?.userId ?? '').trim();
    const username = String(event?.username ?? '').trim();

    if (!SUPPORTED_EVENTS.has(type) || !userId || !username) {
      return false;
    }

    const normalizedEvent = Object.freeze({
      ...event,
      type,
      userId,
      username: normalizeUsername(username),
      timestamp: Number(event.timestamp) || Date.now()
    });

    this.listeners.forEach((listener) => listener(normalizedEvent));
    this.typeListeners.get(type)?.forEach((listener) =>
      listener(normalizedEvent)
    );

    return true;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  on(type, listener) {
    const normalizedType = String(type).toUpperCase();

    if (!SUPPORTED_EVENTS.has(normalizedType)) {
      return () => {};
    }

    if (!this.typeListeners.has(normalizedType)) {
      this.typeListeners.set(normalizedType, new Set());
    }

    const listeners = this.typeListeners.get(normalizedType);
    listeners.add(listener);

    return () => listeners.delete(listener);
  }
}
