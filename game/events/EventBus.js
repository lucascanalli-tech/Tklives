import { LIKE_AGGREGATION_WINDOW_MS } from '../config/GameConfig.js';

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
    this.pendingLikes = new Map();
  }

  publish(event) {
    const type = String(event?.type ?? '').toUpperCase();
    const userId = String(event?.userId ?? '').trim();
    const username = String(event?.username ?? '').trim();

    if (!SUPPORTED_EVENTS.has(type) || !userId || !username) {
      return false;
    }

    const normalizedEvent = {
      ...event,
      type,
      userId,
      username: normalizeUsername(username),
      timestamp: Number(event.timestamp) || Date.now()
    };

    if (type === 'LIKE') {
      this.queueLike(normalizedEvent);
      return true;
    }

    this.dispatch(Object.freeze(normalizedEvent));
    return true;
  }

  queueLike(event) {
    const count = Math.max(1, Number(event.count) || 1);
    const pending = this.pendingLikes.get(event.userId);

    if (pending) {
      pending.count += count;
      pending.event = {
        ...event,
        count: pending.count
      };
      return;
    }

    const entry = {
      count,
      event: {
        ...event,
        count
      },
      timer: null
    };

    entry.timer = setTimeout(
      () => this.flushLike(event.userId),
      LIKE_AGGREGATION_WINDOW_MS
    );

    this.pendingLikes.set(event.userId, entry);
  }

  flushLike(userId) {
    const pending = this.pendingLikes.get(userId);

    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this.pendingLikes.delete(userId);
    this.dispatch(Object.freeze(pending.event));
  }

  flushLikes() {
    for (const userId of Array.from(this.pendingLikes.keys())) {
      this.flushLike(userId);
    }
  }

  dispatch(event) {
    this.listeners.forEach((listener) => listener(event));
    this.typeListeners.get(event.type)?.forEach((listener) =>
      listener(event)
    );
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

  destroy() {
    for (const pending of this.pendingLikes.values()) {
      clearTimeout(pending.timer);
    }

    this.pendingLikes.clear();
    this.listeners.clear();
    this.typeListeners.clear();
  }
}
