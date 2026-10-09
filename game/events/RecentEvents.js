export function eventKey(event) {
  if (!event.eventId) return "";
  return (
    `${event.type}:${event.eventId}` +
    (event.type === "GIFT"
      ? `:${event.data.repeatCount}:${event.data.repeatEnd}`
      : "")
  );
}
// Bounded replay protection; equal names and comments are not duplicate IDs.
export class RecentEvents {
  constructor({ capacity = 10000, ttl = 120000, now = Date.now } = {}) {
    this.entries = new Map();
    this.capacity = capacity;
    this.ttl = ttl;
    this.now = now;
  }
  accept(key) {
    if (!key) return true;
    const time = this.now();
    for (const [id, expiry] of this.entries) {
      if (expiry > time) break;
      this.entries.delete(id);
    }
    if (this.entries.has(key)) return false;
    this.entries.set(key, time + this.ttl);
    while (this.entries.size > this.capacity)
      this.entries.delete(this.entries.keys().next().value);
    return true;
  }
  clear() {
    this.entries.clear();
  }
}
