import { createVisualObject } from "../config/VfxConfig.js";

export class ScreenEffects {
  constructor(manager) {
    this.manager = manager; const { scene: s } = manager, a = s.arenaBounds;
    this.age = 0; this.duration = 0; this.legendary = false; this.ambient = [];
    this.border = s.add.graphics().setDepth(1);
    for (let i = 1; i <= 4; i++) this.border.lineStyle(i * 2, 0x57d4ff, 0.018).strokeRoundedRect(a.x, a.y, a.width, a.height, 18);
    this.border.fillStyle(0x020812, 0.12).fillRect(a.x, a.y, a.width, 14).fillRect(a.x, a.bottom - 14, a.width, 14)
      .fillRect(a.x, a.y, 12, a.height).fillRect(a.right - 12, a.y, 12, a.height);
    this.flash = s.add.rectangle(a.centerX, a.centerY, a.width - 4, a.height - 4, 0xffd77d, 0).setDepth(25);
    this.banner = createVisualObject(() => s.add.text(a.centerX, a.top + 68, "", {
      fontFamily: "Arial, sans-serif", fontSize: s.layout.portrait ? "16px" : "18px", fontStyle: "bold",
      align: "center", color: "#fff4ce", backgroundColor: "#081321ee", stroke: "#081321", strokeThickness: 3,
      padding: { x: 18, y: 10 }, wordWrap: { width: Math.min(360, a.width - 72) },
    }).setOrigin(0.5).setDepth(28).setVisible(false), manager.random);
    if (manager.options.ambientEnabled) for (let i = 0; i < manager.options.ambient; i++) {
      const object = s.add.image(manager.random.between(a.left + 16, a.right - 16), manager.random.between(a.top + 32, a.bottom - 16),
        manager.assets.get("environment")?.key ?? "vfx-glow").setScale(0.08).setAlpha(0.16).setTint(0x57d4ff).setDepth(2);
      this.ambient.push({ object, y: object.y, speed: manager.random.between(3, 8), phase: manager.random.between(0, Math.PI * 2) });
    }
    this.elapsed = 0;
  }
  begin(snapshot, duration) {
    this.age = 0; this.duration = duration; this.legendary = snapshot.tier === "LEGENDARY";
    this.banner.setText(`${snapshot.tier} · ${snapshot.giftName}\n${snapshot.username} · ×${snapshot.quantity}`)
      .setColor(this.legendary ? "#fff0b8" : "#eacbff").setAlpha(0).setScale(0.95).setVisible(true);
  }
  update(delta) {
    this.elapsed += delta;
    const a = this.manager.scene.arenaBounds;
    for (const item of this.ambient) item.object.setY(a.top + 28 + ((item.y - a.top - 28 + this.elapsed * item.speed / 1000) % (a.height - 44)))
      .setAlpha(0.10 + Math.sin(this.elapsed / 1800 + item.phase) * 0.045);
    if (!this.duration) return;
    this.age += delta;
    const p = Math.min(1, this.age / this.duration), fade = Math.min(1, p * 8, (1 - p) * 5);
    this.banner.setAlpha(fade).setScale(0.95 + Math.min(1, p * 6) * 0.05);
    this.flash.setAlpha(this.legendary && this.age < 160 ? (1 - this.age / 160) * 0.055 : 0);
    if (this.legendary && this.manager.options.shake && this.age < 180) {
      const strength = (1 - this.age / 180) * 1.4;
      this.manager.scene.cameras.main.setScroll(Math.sin(this.age * 0.11) * strength, Math.cos(this.age * 0.13) * strength);
    } else this.manager.scene.cameras.main.setScroll(0, 0);
  }
  stop() {
    this.duration = 0; this.flash.setAlpha(0); this.banner.setVisible(false);
    this.manager.scene.cameras.main.setScroll(0, 0);
  }
  destroy() {
    this.stop(); this.border.destroy(); this.flash.destroy(); this.banner.destroy();
    for (const item of this.ambient) item.object.destroy(); this.ambient.length = 0;
  }
}
