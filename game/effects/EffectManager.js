import { getVfxOptions, VisualRandom } from "../config/VfxConfig.js";
import { createProceduralTextures } from "./ProceduralTextures.js";
import { readyVfxAssets } from "./VfxAssets.js";
import { ObjectPool } from "./ObjectPool.js";
import { ParticlePool } from "./ParticlePool.js";

export class EffectManager {
  constructor(scene, options = getVfxOptions(globalThis.location?.search)) {
    this.scene = scene; this.options = options; this.limit = options.objects;
    this.random = new VisualRandom(); this.assets = readyVfxAssets(scene);
    createProceduralTextures(scene);
    this.objects = new Set(); this.records = new Map(); this.channels = new Map();
    this.sprites = new ObjectPool(() => scene.add.sprite(0, 0, "vfx-ring").setDepth(12), options.objects);
    this.labels = new ObjectPool(() => scene.add.text(0, 0, "", {
      fontFamily: "Arial, sans-serif", fontSize: "13px", fontStyle: "bold",
      color: "#e8f6ff", backgroundColor: "#081524ee", padding: { x: 8, y: 5 },
      stroke: "#081524", strokeThickness: 2, wordWrap: { width: 190 },
    }).setOrigin(0.5).setDepth(18), options.labels);
    this.particles = new ParticlePool(this); this.destroyed = false;
  }
  acquire(pool) { return this.objects.size < this.limit ? pool.acquire() : null; }
  track(object, duration, update, pool = this.sprites, channel = null) {
    if (!object) return null;
    if (channel) this.finish(this.channels.get(channel));
    this.objects.add(object); this.records.set(object, { age: 0, duration, update, pool, channel });
    if (channel) this.channels.set(channel, object); return object;
  }
  finish(object) {
    const record = this.records.get(object); if (!record) return;
    if (record.channel && this.channels.get(record.channel) === object) this.channels.delete(record.channel);
    this.records.delete(object); this.objects.delete(object); record.pool.release(object);
  }
  sprite(shape, x, y, color, scale = 1) {
    const object = this.acquire(this.sprites);
    return object?.setTexture(`vfx-${shape}`).setPosition(x, y).setTint(color).setScale(scale).setDepth(12);
  }
  external(role, x, y, color, duration = 600) {
    const asset = this.assets.get(role); if (!asset) return false;
    const object = this.acquire(this.sprites); if (!object) return true;
    object.setTexture(asset.key).setPosition(x, y).setScale(asset.scale).setDepth(13);
    if (asset.tint === true) object.setTint(color);
    if (asset.animation) object.play(asset.animation);
    this.track(object, duration, (o, p) => o.setAlpha(p > 0.8 ? (1 - p) / 0.2 : 1)); return true;
  }
  ring(player, color, size = 34, duration = 650) {
    const object = this.sprite("ring", player.avatar.x, player.avatar.y, color), start = size / 50;
    return this.track(object, duration, (o, p) => o.setScale(start * (0.5 + p * 1.3)).setAlpha((1 - p) * 0.85));
  }
  text(player, value, color = "#e8f6ff", offset = -65, duration = 1400, channel = null) {
    if (channel) this.finish(this.channels.get(channel));
    const object = this.acquire(this.labels); if (!object) return null;
    const a = this.scene.arenaBounds;
    const x = Math.max(a.left + 100, Math.min(a.right - 100, player.avatar.x));
    const y = Math.max(a.top + 65, player.avatar.y + offset);
    object.setText(String(value).slice(0, 100)).setStyle({ color }).setPosition(x, y).setDepth(18);
    return this.track(object, duration, (o, p) => o.setY(y - p * 24).setAlpha(p < 0.7 ? 1 : (1 - p) / 0.3), this.labels, channel);
  }
  attack(player, target) {
    const x = player.avatar.x, y = player.avatar.y, dx = target.avatar.x - x, dy = target.avatar.y - y;
    const angle = Math.atan2(dy, dx), projectile = this.sprite("glow", x, y, player.color, 0.32);
    this.track(projectile, 170, (o, p) => o.setPosition(x + dx * p, y + dy * p).setRotation(angle).setScale(0.45, 0.13).setAlpha(1 - p * 0.5));
  }
  update(time, delta) {
    const step = Math.max(0, delta);
    for (const [object, record] of this.records) {
      record.age += step;
      if (record.age >= record.duration) { this.finish(object); continue; }
      record.update(object, record.age / record.duration);
    }
    this.particles.update(step);
  }
  metrics() {
    return { quality: this.options.quality, effects: this.objects.size, limit: this.limit,
      sprites: this.sprites.metrics(), labels: this.labels.metrics(), particles: this.particles.pool.metrics(),
      visualTimers: 0, visualTweens: 0, channels: this.channels.size, loadedAssets: this.assets.size };
  }
  destroy() {
    if (this.destroyed) return; this.destroyed = true;
    this.records.clear(); this.channels.clear(); this.objects.clear();
    this.particles.destroy(); this.sprites.destroy(); this.labels.destroy();
  }
}
