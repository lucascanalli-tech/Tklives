import { MAX_VISUAL_EFFECTS } from "../config/GameConfig.js";
export class VisualEffects {
  constructor(scene, limit = MAX_VISUAL_EFFECTS) {
    this.scene = scene;
    this.limit = limit;
    this.objects = new Set();
  }
  create(factory, tween = {}) {
    if (this.objects.size >= this.limit) return null;
    const object = factory().setDepth(12);
    this.objects.add(object);
    this.scene.tweens.add({
      targets: object,
      alpha: 0,
      duration: 600,
      ...tween,
      onComplete: () => {
        this.objects.delete(object);
        object.destroy();
      },
    });
    return object;
  }
  ring(player, color, size = 34, duration = 650) {
    return this.create(
      () =>
        this.scene.add
          .circle(player.avatar.x, player.avatar.y, size, color, 0)
          .setStrokeStyle(2, color, 0.85)
          .setScale(0.5),
      { scale: 1.8, duration },
    );
  }
  text(player, text, color = "#e8f6ff", offset = -65, duration = 1400) {
    const x = Phaser.Math.Clamp(
      player.avatar.x,
      this.scene.arenaBounds.left + 85,
      this.scene.arenaBounds.right - 85,
    );
    const y = Math.max(
      this.scene.arenaBounds.top + 65,
      player.avatar.y + offset,
    );
    return this.create(
      () =>
        this.scene.add
          .text(x, y, text, {
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
            color,
            backgroundColor: "#091524ee",
            padding: { x: 9, y: 6 },
            stroke: "#091524",
            strokeThickness: 2,
            wordWrap: { width: 180 },
          })
          .setOrigin(0.5),
      { y: y - 26, duration, ease: "Sine.easeOut" },
    );
  }
  attack(player, target) {
    this.create(
      () => {
        const g = this.scene.add.graphics();
        g.lineStyle(5, player.color, 0.18);
        g.lineBetween(
          player.avatar.x,
          player.avatar.y,
          target.avatar.x,
          target.avatar.y,
        );
        g.lineStyle(2, 0xd7ffff, 0.9);
        g.lineBetween(
          player.avatar.x,
          player.avatar.y,
          target.avatar.x,
          target.avatar.y,
        );
        return g;
      },
      { duration: 160 },
    );
  }
  destroy() {
    for (const object of this.objects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }
    this.objects.clear();
  }
}
