const ATTACK_RANGE = 150;
const ATTACK_COOLDOWN = 900;
const SEARCH_INTERVAL = 180;
const EFFECT_DURATION = 140;
const ATTACK_DAMAGE = 20;

export class AutoCombat {
  constructor(scene, player, getPlayers) {
    this.scene = scene;
    this.player = player;
    this.getPlayers = getPlayers;
    this.nextActionTime = 0;
  }

  update(time) {
    if (!this.player.isAlive() || time < this.nextActionTime) {
      return;
    }

    const target = this.findNearestTarget();

    if (!target) {
      this.nextActionTime = time + SEARCH_INTERVAL;
      return;
    }

    this.attack(target);
    this.nextActionTime = time + ATTACK_COOLDOWN;
  }

  findNearestTarget() {
    let nearestTarget = null;
    let nearestDistance = ATTACK_RANGE;

    for (const candidate of this.getPlayers()) {
      if (candidate === this.player || !candidate.isAlive()) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.avatar.x,
        this.player.avatar.y,
        candidate.avatar.x,
        candidate.avatar.y
      );

      if (distance <= nearestDistance) {
        nearestTarget = candidate;
        nearestDistance = distance;
      }
    }

    return nearestTarget;
  }

  attack(target) {
    const damageApplied = target.health?.takeDamage(
      ATTACK_DAMAGE,
      this.player
    );

    if (!damageApplied) {
      return;
    }

    const effect = this.scene.add.graphics();
    effect.lineStyle(4, 0xfde047, 0.95);
    effect.lineBetween(
      this.player.avatar.x,
      this.player.avatar.y,
      target.avatar.x,
      target.avatar.y
    );

    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      duration: EFFECT_DURATION,
      onComplete: () => effect.destroy()
    });
  }
}
