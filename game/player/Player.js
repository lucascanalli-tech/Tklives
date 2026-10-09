const RADIUS = 19;
export class Player {
  constructor(scene, { userId, username, x, y, color, bounds, isBot = false }) {
    this.scene = scene;
    this.userId = String(userId);
    this.bounds = bounds;
    this.color = color;
    this.isBot = isBot;
    this.alive = true;
    this.energy = 0;
    this.boostUntil = 0;
    this.damageMultiplier = 1;
    this.visualTimes = new Map();
    const key = `fighter-${color}`;
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x071323).fillRoundedRect(6, 4, 32, 35, 9);
      g.lineStyle(2, color).strokeRoundedRect(6, 4, 32, 35, 9);
      g.fillStyle(color, 0.7).fillRoundedRect(10, 8, 24, 15, 5);
      g.fillStyle(0xe7ffff).fillRoundedRect(14, 12, 16, 4, 2);
      g.fillStyle(color).fillRect(10, 28, 6, 9).fillRect(28, 28, 6, 9);
      g.fillStyle(0xffffff, 0.25).fillRect(19, 28, 6, 5);
      g.generateTexture(key, 44, 44);
      g.destroy();
    }
    this.shadow = scene.add.ellipse(0, 19, 40, 12, 0x000000, 0.42);
    this.body = scene.add.image(0, 0, key);
    this.avatar = scene.add
      .container(x, y, [this.shadow, this.body])
      .setDepth(3);
    this.nameText = scene.add
      .text(x, y - 29, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: isBot ? "#7b93ac" : "#f0faff",
        stroke: "#06101f",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(5);
    this.setUsername(username);
    this.setPosition(x, y);
    scene.visualEffects?.ring(this, color, 28, 550);
  }
  setUsername(username) {
    this.username = String(username).startsWith("@")
      ? String(username)
      : `@${username}`;
    this.nameText.setText(this.username);
    if (this.nameText.width > 160) this.nameText.setFontSize(11);
  }
  getMovementBounds() {
    return {
      left: this.bounds.left + RADIUS + 4,
      right: this.bounds.right - RADIUS - 4,
      top: this.bounds.top + 68,
      bottom: this.bounds.bottom - RADIUS - 8,
    };
  }
  getHealthBarPosition() {
    return { x: this.avatar.x, y: this.avatar.y - 53 };
  }
  isAlive() {
    return this.alive;
  }
  setAlive(alive) {
    this.alive = alive;
    this.avatar.setVisible(alive);
    this.nameText.setVisible(alive);
  }
  setPosition(x, y) {
    const b = this.getMovementBounds();
    const sx = Phaser.Math.Clamp(x, b.left, b.right);
    const sy = Phaser.Math.Clamp(y, b.top, b.bottom);
    this.avatar.setPosition(sx, sy);
    this.nameText.setPosition(sx, sy - 29);
  }
  update(time) {
    this.body.setY(Math.sin(time / 350 + this.avatar.x) * 1.5);
    if (Date.now() >= this.boostUntil) this.damageMultiplier = 1;
  }
  applyBonus({ energy = 0, heal = 0, boost = 1, duration = 0 }) {
    this.energy = Math.min(100, this.energy + energy);
    this.health?.heal(heal);
    if (boost > 1) {
      this.damageMultiplier = boost;
      this.boostUntil = Date.now() + duration;
    }
  }
  allowVisual(type, cooldown) {
    const now = Date.now();
    if ((this.visualTimes.get(type) ?? 0) > now) return false;
    this.visualTimes.set(type, now + cooldown);
    return true;
  }
  hit() {
    this.scene.tweens.killTweensOf(this.body);
    this.body.setScale(1);
    this.body.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this.body,
      scaleX: 0.85,
      scaleY: 1.1,
      duration: 65,
      yoyo: true,
      onComplete: () => this.body?.clearTint(),
    });
  }
  destroy() {
    this.scene.tweens.killTweensOf(this.body);
    this.avatar.destroy();
    this.nameText.destroy();
    this.visualTimes.clear();
  }
}
