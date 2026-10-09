const ATTACK_RANGE = 150;
const ATTACK_COOLDOWN = 900;
const SEARCH_INTERVAL = 180;
const ATTACK_DAMAGE = 20;

export class AutoCombat {
  constructor(scene, player, getCandidates) {
    this.scene = scene;
    this.player = player;
    this.getCandidates = getCandidates;
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

    for (const candidate of this.getCandidates()) {
      if (candidate === this.player || !candidate.isAlive()) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.avatar.x,
        this.player.avatar.y,
        candidate.avatar.x,
        candidate.avatar.y,
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
      Math.round(
        (ATTACK_DAMAGE + Math.min(10, this.player.energy / 10)) *
          this.player.damageMultiplier,
      ),
      this.player,
    );

    if (!damageApplied) {
      return;
    }

    this.player.energy = Math.max(0, this.player.energy - 4);
    this.scene.visualEffects.attack(this.player, target);
  }
}
