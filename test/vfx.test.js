import test from "node:test";
import assert from "node:assert/strict";
import { createVisualObject, getVfxOptions, VisualRandom } from "../game/config/VfxConfig.js";
import { validateVfxManifest } from "../game/effects/VfxAssets.js";
import { ObjectPool } from "../game/effects/ObjectPool.js";
import { getVisualGiftTier } from "../game/config/GiftVisualConfig.js";
import { getGiftEffect } from "../game/gifts/GiftConfig.js";
import { PresentationQueue } from "../game/effects/PresentationQueue.js";

test("visual quality has bounded budgets and does not consume gameplay randomness", () => {
  assert.equal(getVfxOptions().quality, "MEDIUM");
  assert.equal(getVfxOptions("?vfxQuality=unknown").quality, "MEDIUM");
  assert.equal(getVfxOptions("?vfxQuality=low&vfxShake=off").shake, false);
  const old = Math.random;
  Math.random = () => { throw new Error("Visual randomness leaked into gameplay"); };
  try {
    const a = new VisualRandom(), b = new VisualRandom();
    for (let i = 0; i < 1000; i++) assert.equal(a.next(), b.next());
  } finally { Math.random = old; }
});
test("Phaser visual texture allocation restores the gameplay random source even on error", () => {
  const original = Math.random, rng = new VisualRandom();
  createVisualObject(() => { assert.notEqual(Math.random, original); Math.random(); }, rng);
  assert.equal(Math.random, original);
  assert.throws(() => createVisualObject(() => { throw new Error("factory failed"); }, rng));
  assert.equal(Math.random, original);
});
test("manifest restricts paths, roles, frame sizes and duplicate assets", () => {
  const good = { role: "hit", type: "spritesheet", path: "assets/vfx/combat/hit/spark.png", frameWidth: 64, frameHeight: 64 };
  assert.equal(validateVfxManifest({ assets: [good] }).length, 1);
  for (const patch of [{ path: "https://example.com/private.png" }, { path: "assets/vfx/../../private.png" },
    { path: "assets/vfx/file.svg" }, { frameWidth: -1 }, { role: "invented" }, { enabled: false }])
    assert.equal(validateVfxManifest({ assets: [{ ...good, ...patch }] }).length, 0);
  assert.equal(validateVfxManifest({ assets: [good, good] }).length, 1);
  assert.deepEqual(validateVfxManifest(null), []);
});
test("pool reuses a bounded number of objects after repeated saturation and releases", () => {
  let created = 0, destroyed = 0;
  const factory = () => {
    created++;
    const object = { destroy() { destroyed++; } };
    for (const method of ["setActive", "setVisible", "setAlpha", "setScale", "setRotation"])
      object[method] = () => object;
    return object;
  };
  const pool = new ObjectPool(factory, 12);
  for (let cycle = 0; cycle < 100; cycle++) {
    const active = Array.from({ length: 12 }, () => pool.acquire());
    assert.equal(pool.acquire(), null);
    for (const object of active) { pool.release(object); pool.release(object); }
    assert.equal(pool.active.size, 0);
    assert.equal(pool.free.length, 12);
  }
  assert.equal(created, 12);
  pool.destroy(); assert.equal(destroyed, 12); assert.equal(pool.all.size, 0);
});
test("four presentation tiers leave the gameplay gift configuration independent", () => {
  for (const [diamonds, visual, gameplay] of [[1,"COMMON","small"],[100,"RARE","medium"],[500,"EPIC","medium"],[1000,"LEGENDARY","special"]]) {
    const data = { giftName: "Unknown gift", diamondCount: diamonds };
    assert.equal(getVisualGiftTier(data), visual);
    assert.equal(getGiftEffect(data).tier, gameplay);
  }
  assert.equal(getVisualGiftTier({ giftName: "Rose" }), "COMMON");
  assert.equal(getVisualGiftTier({ giftName: "Unknown" }), "COMMON");
});
test("visual presentations prioritize rare events and keep at most one active banner", () => {
  const played = []; let finished = 0;
  const queue = new PresentationQueue(value => played.push(value), () => finished++, 3);
  queue.enqueue("epic", 2, 100); queue.enqueue("legendary", 3, 100); queue.enqueue("epic2", 2, 100); queue.enqueue("epic3", 2, 100);
  assert.equal(queue.pending.length, 3); assert.equal(queue.dropped, 1);
  queue.update(1); assert.deepEqual(played, ["legendary"]);
  queue.update(50); assert.deepEqual(played, ["legendary"]);
  queue.update(50); assert.deepEqual(played, ["legendary", "epic"]); assert.equal(finished, 1);
  queue.destroy(); assert.equal(queue.active, null); assert.equal(queue.pending.length, 0);
});
test("stale visual presentations expire without running a gameplay callback", () => {
  let calls = 0; const queue = new PresentationQueue(() => calls++, () => {});
  for (let i = 0; i < 100; i++) queue.enqueue(i, 2, 1400);
  assert.equal(queue.pending.length, 8); queue.update(6001);
  assert.equal(calls, 0); assert.equal(queue.pending.length, 0); assert.equal(queue.dropped, 100);
});
