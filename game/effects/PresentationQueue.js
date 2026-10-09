// A queue of visual snapshots, never a queue of gameplay events.
export class PresentationQueue {
  constructor(present, finish, capacity = 8) {
    this.present = present; this.finish = finish; this.capacity = capacity;
    this.pending = []; this.active = null; this.sequence = 0; this.dropped = 0;
  }
  enqueue(value, priority, duration) {
    const item = { value, priority, duration, remaining: duration, waiting: 0, sequence: this.sequence++ };
    this.pending.push(item);
    this.pending.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
    if (this.pending.length > this.capacity) { this.pending.pop(); this.dropped++; }
  }
  update(delta) {
    for (const item of this.pending) item.waiting += delta;
    this.pending = this.pending.filter(item => {
      if (item.waiting <= 6000) return true;
      this.dropped++; return false;
    });
    if (this.active) {
      this.active.remaining -= delta;
      if (this.active.remaining <= 0) { this.finish(); this.active = null; }
    }
    if (!this.active && this.pending.length) {
      this.active = this.pending.shift(); this.present(this.active.value, this.active.duration);
    }
  }
  destroy() { this.pending.length = 0; this.active = null; this.finish(); }
}
