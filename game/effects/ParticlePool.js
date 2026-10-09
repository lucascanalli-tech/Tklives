import { ObjectPool } from "./ObjectPool.js";
export class ParticlePool {
  constructor(manager) {
    this.manager = manager;
    this.pool = new ObjectPool(() => manager.scene.add.image(0, 0, "vfx-spark").setDepth(11), manager.options.particles);
  }
  emit(x, y, { count = 8, color = 0x57d4ff, shape = "spark", speed = 85, duration = 450, size = 0.15, gravity = 30, upward = false } = {}) {
    const m = this.manager, total = Math.max(1, Math.round(count * m.options.burst));
    const external = m.assets.get(`particle.${shape}`);
    for (let i = 0; i < total; i++) {
      const object = this.pool.acquire(); if (!object) break;
      const angle = upward ? m.random.between(-2.3, -0.8) : m.random.between(0, Math.PI * 2);
      const velocity = m.random.between(speed * 0.35, speed);
      object.setTexture(external?.key ?? `vfx-${shape}`).setPosition(x, y).setTint(color).setScale(size * (external?.scale ?? 1));
      object._particle = { x, y, age: 0, duration: duration * m.random.between(0.75, 1.2), vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity, gravity, size: object.scaleX, rotation: m.random.between(-2, 2) };
    }
  }
  update(delta) {
    for (const object of this.pool.active) {
      const p = object._particle; p.age += delta;
      if (p.age >= p.duration) { object._particle = null; this.pool.release(object); continue; }
      const t = p.age / 1000, progress = p.age / p.duration;
      object.setPosition(p.x + p.vx * t, p.y + p.vy * t + p.gravity * t * t * 0.5);
      object.setAlpha((1 - progress) * 0.9).setScale(p.size * (1 - progress * 0.45)).setRotation(p.rotation * t);
    }
  }
  destroy() { this.pool.destroy(); }
}
