const MAX_HEALTH = 100;
const RESPAWN_DELAY = 2000;
export class HealthSystem {
  constructor(scene, player, onDeath = null) {
    this.scene = scene;
    this.player = player;
    this.onDeath = onDeath;
    this.maxHealth = MAX_HEALTH;
    this.currentHealth = MAX_HEALTH;
    this.respawnTimer = null;
    const { x, y } = player.getHealthBarPosition();
    this.background = scene.add
      .rectangle(x, y, 44, 6, 0x081321)
      .setStrokeStyle(1, 0x6581a0, 0.6)
      .setDepth(5);
    this.fill = scene.add
      .rectangle(x - 21, y, 42, 4, 0x57f5bc)
      .setOrigin(0, 0.5)
      .setDepth(6);
    player.health = this;
  }
  update() {
    if (!this.player.isAlive()) return;
    const { x, y } = this.player.getHealthBarPosition();
    this.background.setPosition(x, y);
    this.fill.setPosition(x - 21, y);
  }
  takeDamage(amount, attacker = null) {
    if (!this.player.isAlive() || amount <= 0) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateBar();
    this.player.hit();
    if (this.currentHealth === 0) this.die(attacker);
    return true;
  }
  heal(amount) {
    if (!this.player.isAlive() || !(amount > 0)) return;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.updateBar();
  }
  updateBar() {
    this.fill.setScale(this.currentHealth / this.maxHealth, 1);
    this.fill.setFillStyle(this.currentHealth > 35 ? 0x57f5bc : 0xff638e);
  }
  die(attacker) {
    this.scene.visualEffects.ring(this.player, this.player.color, 35, 450);
    this.player.setAlive(false);
    this.background.setVisible(false);
    this.fill.setVisible(false);
    this.onDeath?.(attacker, this.player);
    this.respawnTimer = this.scene.time.delayedCall(RESPAWN_DELAY, () =>
      this.respawn(),
    );
  }
  respawn() {
    this.respawnTimer?.remove(false);
    this.respawnTimer = null;
    const b = this.player.getMovementBounds();
    this.currentHealth = this.maxHealth;
    this.updateBar();
    this.player.setPosition(
      Phaser.Math.FloatBetween(b.left, b.right),
      Phaser.Math.FloatBetween(b.top, b.bottom),
    );
    this.player.setAlive(true);
    this.background.setVisible(true);
    this.fill.setVisible(true);
    this.update();
    this.scene.visualEffects.ring(this.player, 0x57d4ff, 38, 650);
  }
  destroy() {
    this.respawnTimer?.remove(false);
    this.respawnTimer = null;
    if (this.player.health === this) this.player.health = null;
    this.background.destroy();
    this.fill.destroy();
  }
}
