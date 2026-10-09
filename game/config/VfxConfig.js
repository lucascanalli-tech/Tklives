// Presentation budgets only. Gameplay configuration stays in GameConfig.js.
export const VFX_QUALITY = Object.freeze({
  LOW: { particles: 96, objects: 60, labels: 8, burst: 0.45, ambient: 0, damageNumbers: false },
  MEDIUM: { particles: 224, objects: 100, labels: 14, burst: 1, ambient: 8, damageNumbers: true },
  HIGH: { particles: 360, objects: 100, labels: 20, burst: 1.5, ambient: 14, damageNumbers: true },
});
export function getVfxOptions(search = "") {
  const params = new URLSearchParams(search);
  const requested = (params.get("vfxQuality") || "MEDIUM").toUpperCase();
  const quality = VFX_QUALITY[requested] ? requested : "MEDIUM";
  return { quality, ...VFX_QUALITY[quality], shake: params.get("vfxShake") !== "off",
    ambientEnabled: params.get("vfxAmbient") !== "off", debug: params.get("debugVfx") === "1" };
}
// Never consume Math.random / Phaser.Math: those also drive gameplay movement.
export class VisualRandom {
  constructor(seed = 0x6e656f6e) { this.seed = seed >>> 0; }
  next() {
    let x = this.seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0; return this.seed / 4294967296;
  }
  between(min, max) { return min + (max - min) * this.next(); }
}
