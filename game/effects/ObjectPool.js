export class ObjectPool {
  constructor(factory, capacity) {
    this.factory = factory; this.capacity = capacity;
    this.all = new Set(); this.active = new Set(); this.free = [];
    this.peak = 0; this.dropped = 0;
  }
  acquire() {
    let object = this.free.pop();
    if (!object) {
      if (this.all.size >= this.capacity) { this.dropped++; return null; }
      object = this.factory(); this.all.add(object);
    }
    this.active.add(object); this.peak = Math.max(this.peak, this.active.size);
    object.setActive(true).setVisible(true).setAlpha(1).setScale(1).setRotation(0);
    object.clearTint?.(); return object;
  }
  release(object) {
    if (!this.active.delete(object)) return;
    object.stop?.(); object.setActive(false).setVisible(false); this.free.push(object);
  }
  metrics() { return { active: this.active.size, allocated: this.all.size, capacity: this.capacity, peak: this.peak, dropped: this.dropped }; }
  destroy() {
    for (const object of this.all) object.destroy();
    this.all.clear(); this.active.clear(); this.free.length = 0;
  }
}
