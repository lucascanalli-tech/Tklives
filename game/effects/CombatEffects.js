export class CombatEffects {
  constructor(manager) { this.manager = manager; }
  attack(player, target) {
    const m = this.manager, x = player.avatar.x, y = player.avatar.y;
    const dx = target.avatar.x - x, dy = target.avatar.y - y, angle = Math.atan2(dy, dx);
    if (!m.external("attack", x + dx * 0.35, y + dy * 0.35, player.color, 220)) {
      const slash = m.sprite("slash", x, y, player.color, 0.8);
      m.track(slash, 190, (o, p) => o.setRotation(angle - 0.4 + p * 0.9).setScale(0.6 + p * 0.5).setAlpha(1 - p));
    }
    const projectile = m.sprite("glow", x, y, player.color, 0.4);
    m.track(projectile, 170, (o, p) => o.setPosition(x + dx * p, y + dy * p)
      .setRotation(angle).setScale(0.62, 0.14).setAlpha(1 - p * 0.4));
    for (let i = 1; i <= 3; i++) m.particles.emit(x + dx * i / 4, y + dy * i / 4,
      { count: 1, color: player.color, shape: "glow", size: 0.13, speed: 10, duration: 180, gravity: 0 });
  }
  hit(player, damage = 0) {
    const m = this.manager, { x, y } = player.avatar;
    if (!m.external("hit", x, y, player.color, 260)) m.ring(player, 0xe8ffff, 18, 200);
    m.particles.emit(x, y, { count: 5, color: 0xd9faff, speed: 115, duration: 280, size: 0.12 });
    m.punch(player);
    if (m.options.damageNumbers && damage > 0) m.text(player, `−${Math.round(damage)}`, "#ffc6d4", -60, 620, `damage:${player.userId}`);
  }
}
