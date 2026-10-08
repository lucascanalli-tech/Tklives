const MAX_HEALTH = 100;
const RESPAWN_DELAY = 2000;
const BAR_WIDTH = 48;
const BAR_HEIGHT = 7;

export class HealthSystem {
  constructor(scene, player, onDeath = null) {
    this.scene = scene;
    this.player = player;
    this.onDeath = onDeath;
    this.maxHealth = MAX_HEALTH;
    this.currentHealth = MAX_HEALTH;
    this.respawnTimer = null;

    const { x, y } = this.player.getHealthBarPosition();

    this.background = scene.add
      .rectangle(x, y, BAR_WIDTH, BAR_HEIGHT, 0x0f172a, 0.9)
      .setStrokeStyle(1, 0xf8fafc, 0.55);

    this.fill = scene.add
      .rectangle(x - BAR_WIDTH / 2, y, BAR_WIDTH, BAR_HEIGHT - 2, 0x22c55e, 1)
      .setOrigin(0, 0.5);

    this.player.health = this;
  }

  update() {
    if (!this.player.isAlive()) {
      return;
    }

    const { x, y } = this.player.getHealthBarPosition();
    this.background.setPosition(x, y);
    this.fill.setPosition(x - BAR_WIDTH / 2, y);
  }

  takeDamage(amount, attacker = null) {
    if (!this.player.isAlive() || amount <= 0) {
      return false;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateBar();

    if (this.currentHealth === 0) {
      this.die(attacker);
    }

    return true;
  }

  updateBar() {
    const ratio = this.currentHealth / this.maxHealth;
    this.fill.setScale(ratio, 1);
  }

  die(attacker) {
    this.player.setAlive(false);
    this.background.setVisible(false);
    this.fill.setVisible(false);

    this.onDeath?.(attacker, this.player);

    this.respawnTimer = this.scene.time.delayedCall(
      RESPAWN_DELAY,
      () => this.respawn()
    );
  }

  respawn() {
    const bounds = this.player.getMovementBounds();
    const x = Phaser.Math.FloatBetween(bounds.left, bounds.right);
    const y = Phaser.Math.FloatBetween(bounds.top, bounds.bottom);

    this.currentHealth = this.maxHealth;
    this.updateBar();
    this.player.setPosition(x, y);
    this.player.setAlive(true);
    this.background.setVisible(true);
    this.fill.setVisible(true);
    this.update();
    this.respawnTimer = null;
  }
}
