import test from "node:test";
import assert from "node:assert/strict";
import { getVfxOptions, VisualRandom } from "../game/config/VfxConfig.js";
import { validateVfxManifest } from "../game/effects/VfxAssets.js";
import { ObjectPool } from "../game/effects/ObjectPool.js";

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
