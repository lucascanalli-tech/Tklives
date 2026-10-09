import { createVisualObject, getVfxOptions, VisualRandom } from "../config/VfxConfig.js";
import { createProceduralTextures } from "./ProceduralTextures.js";
import { readyVfxAssets } from "./VfxAssets.js";
import { ObjectPool } from "./ObjectPool.js";
import { ParticlePool } from "./ParticlePool.js";
import { CombatEffects } from "./CombatEffects.js";
import { DeathEffects } from "./DeathEffects.js";
import { RespawnEffects } from "./RespawnEffects.js";
import { ScreenEffects } from "./ScreenEffects.js";
import { GiftPresentation } from "./GiftPresentation.js";
import { InteractionPresentation } from "./InteractionPresentation.js";

export class EffectManager {
  constructor(scene, options = getVfxOptions(globalThis.location?.search)) {
    this.scene = scene; this.options = options; this.limit = options.objects;
    this.random = new VisualRandom(); this.assets = readyVfxAssets(scene);
    createProceduralTextures(scene);
    this.objects = new Set(); this.records = new Map(); this.channels = new Map();
    this.sprites = new ObjectPool(() => scene.add.sprite(0, 0, "vfx-ring").setDepth(12), options.objects);
    this.labels = new ObjectPool(() => createVisualObject(() => scene.add.text(0, 0, "", {
      fontFamily: "Arial, sans-serif", fontSize: "13px", fontStyle: "bold",
      color: "#e8f6ff", backgroundColor: "#081524ee", padding: { x: 8, y: 5 },
      stroke: "#081524", strokeThickness: 2, wordWrap: { width: 190 },
    }).setOrigin(0.5).setDepth(18), this.random), options.labels);
    this.particles = new ParticlePool(this); this.destroyed = false;
    this.playerStates = new Map();
    this.combat = new CombatEffects(this);
    this.deaths = new DeathEffects(this);
    this.portals = new RespawnEffects(this);
    this.screen = new ScreenEffects(this);
    this.gifts = new GiftPresentation(this);
    this.interactions = new InteractionPresentation(this);
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
    object.setText(String(value).slice(0, 100)).setStyle({ color }).setDepth(18);
    let x = Math.max(a.left + object.width / 2 + 8, Math.min(a.right - object.width / 2 - 8, player.avatar.x));
    let y = Math.max(a.top + 65, player.avatar.y + offset);
    if (channel?.startsWith("comment:")) {
      const slot = this.commentSlot(x, y, object.width, object.height);
      if (!slot) { this.labels.release(object); return null; }
      ({ x, y } = slot);
    }
    object.setPosition(x, y);
    return this.track(object, duration, (o, p) => o.setY(y - p * 24).setAlpha(p < 0.7 ? 1 : (1 - p) / 0.3), this.labels, channel);
  }
  attack(player, target) {
    this.combat.attack(player, target);
  }
  hit(player, damage) { this.combat.hit(player, damage); }
  death(player) { this.deaths.show(player); }
  spawn(player) { this.portals.show(player); }
  respawn(player) { this.portals.show(player, true); }
  gift(player, event, tier = null) { this.gifts.show(player, event, tier); }
  interaction(player, event) { this.interactions.show(player, event); }
  commentSlot(x, y, width, height) {
    const a = this.scene.arenaBounds;
    const comments = [...this.channels].filter(([key]) => key.startsWith("comment:")).map(([, object]) => object.getBounds());
    for (const offset of [0, -42, -84, 42]) {
      const cy = Math.max(a.top + 48 + height / 2, Math.min(a.bottom - height / 2 - 8, y + offset));
      if (comments.every(b => Math.abs(b.centerX - x) > (b.width + width) / 2 + 8 || Math.abs(b.centerY - cy) > (b.height + height) / 2 + 28)) return { x, y: cy };
    }
    return null;
  }
  punch(player) {
    this.scene.tweens.killTweensOf(player.body);
    const state = this.playerStates.get(player) ?? {};
    state.punch = 0; this.playerStates.set(player, state);
    player.body.setTintFill(0xffffff);
  }
  fadeName(player) {
    const state = this.playerStates.get(player) ?? {};
    state.name = 0; this.playerStates.set(player, state); player.nameText.setAlpha(0);
  }
  releasePlayer(player) {
    this.playerStates.delete(player);
    if (player.body?.scene) player.body.setX(0).setScale(1).clearTint();
    if (player.nameText?.scene) player.nameText.setAlpha(1);
    this.finish(this.channels.get(`damage:${player.userId}`));
    this.finish(this.channels.get(`comment:${player.userId}`));
    for (const type of ["like", "follow", "share", "gift"]) this.finish(this.channels.get(`${type}:${player.userId}`));
  }
  updatePlayers(delta) {
    for (const [player, state] of this.playerStates) {
      if (!player.body?.scene) { this.playerStates.delete(player); continue; }
      if (state.punch !== undefined) {
        state.punch += delta; const p = Math.min(1, state.punch / 140), bump = Math.sin(p * Math.PI);
        // Only the body inside the avatar container moves; logical coordinates stay intact.
        player.body.setX(Math.sin(p * Math.PI * 4) * (1 - p) * 1.7).setScale(1 - bump * 0.13, 1 + bump * 0.1);
        if (p >= 1) { player.body.setX(0).setScale(1).clearTint(); delete state.punch; }
      }
      if (state.name !== undefined) {
        state.name += delta; player.nameText.setAlpha(Math.min(1, state.name / 350));
        if (state.name >= 350) delete state.name;
      }
      if (!Object.keys(state).length) this.playerStates.delete(player);
    }
  }
  update(time, delta) {
    const step = Math.max(0, delta);
    for (const [object, record] of this.records) {
      record.age += step;
      if (record.age >= record.duration) { this.finish(object); continue; }
      record.update(object, record.age / record.duration);
    }
    this.particles.update(step);
    this.updatePlayers(step);
    this.gifts.update(step);
    this.screen.update(step);
  }
  metrics() {
    return { quality: this.options.quality, effects: this.objects.size, limit: this.limit,
      sprites: this.sprites.metrics(), labels: this.labels.metrics(), particles: this.particles.pool.metrics(),
      visualTimers: 0, visualTweens: 0, playerStates: this.playerStates.size,
      presentations: { active: this.gifts.queue.active ? 1 : 0, pending: this.gifts.queue.pending.length,
        capacity: this.gifts.queue.capacity, dropped: this.gifts.queue.dropped }, ambient: this.screen.ambient.length,
      channels: this.channels.size, loadedAssets: this.assets.size };
  }
  destroy() {
    if (this.destroyed) return; this.destroyed = true;
    for (const player of this.playerStates.keys()) this.releasePlayer(player);
    this.gifts.destroy(); this.screen.destroy();
    this.records.clear(); this.channels.clear(); this.objects.clear();
    this.particles.destroy(); this.sprites.destroy(); this.labels.destroy();
  }
}
