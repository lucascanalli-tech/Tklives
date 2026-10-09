import { LIKE_AGGREGATION_WINDOW_MS } from "../config/GameConfig.js";
import { normalizeInternalEvent, EVENT_TYPES } from "./InternalEvent.js";
import { RecentEvents, eventKey } from "./RecentEvents.js";
export { EVENT_TYPES };
export class EventBus {
  constructor() {
    this.listeners = new Set();
    this.typeListeners = new Map();
    this.pendingLikes = new Map();
    this.recent = new RecentEvents();
  }
  publish(input) {
    const event = normalizeInternalEvent(input);
    if (!event || !this.recent.accept(eventKey(event))) return false;
    if (event.type === "LIKE") this.queueLike(event);
    else this.dispatch(event);
    return true;
  }
  queueLike(event) {
    const pending = this.pendingLikes.get(event.userId);
    if (pending) {
      pending.count = Math.min(1000000, pending.count + event.data.count);
      pending.event = event;
      return;
    }
    // Cap timers, not accepted interactions. Flush an older batch on overflow.
    if (this.pendingLikes.size >= 1000)
      this.flushLike(this.pendingLikes.keys().next().value);
    const entry = {
      count: event.data.count,
      event,
      timer: setTimeout(
        () => this.flushLike(event.userId),
        LIKE_AGGREGATION_WINDOW_MS,
      ),
    };
    this.pendingLikes.set(event.userId, entry);
  }
  flushLike(userId) {
    const pending = this.pendingLikes.get(userId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingLikes.delete(userId);
    this.dispatch(
      Object.freeze({
        ...pending.event,
        data: Object.freeze({ count: pending.count }),
      }),
    );
  }
  flushLikes() {
    for (const id of [...this.pendingLikes.keys()]) this.flushLike(id);
  }
  dispatch(event) {
    this.listeners.forEach((listener) => listener(event));
    this.typeListeners.get(event.type)?.forEach((listener) => listener(event));
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  on(type, listener) {
    if (!EVENT_TYPES.includes(type)) return () => {};
    if (!this.typeListeners.has(type)) this.typeListeners.set(type, new Set());
    this.typeListeners.get(type).add(listener);
    return () => this.typeListeners.get(type)?.delete(listener);
  }
  destroy() {
    for (const entry of this.pendingLikes.values()) clearTimeout(entry.timer);
    this.pendingLikes.clear();
    this.recent.clear();
    this.listeners.clear();
    this.typeListeners.clear();
  }
}
