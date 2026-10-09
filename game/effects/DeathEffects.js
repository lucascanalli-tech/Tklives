export class DeathEffects {
  constructor(manager) { this.manager = manager; }
  show(player) {
    const m = this.manager, { x, y } = player.avatar;
    m.releasePlayer(player);
    if (!m.external("death", x, y, player.color, 520)) {
      const ghost = m.acquire(m.sprites);
      if (ghost) {
        ghost.setTexture(player.body.texture.key).setPosition(x, y).setDepth(13);
        m.track(ghost, 520, (o, p) => o.setY(y - p * 9).setScale(1 + p * 0.3)
          .setAlpha((1 - p) ** 2).setTint(p > 0.2 ? player.color : 0xffffff));
      }
      m.ring(player, player.color, 32, 430);
      m.ring(player, 0xe9ffff, 20, 300);
    }
    m.particles.emit(x, y, { count: 15, color: player.color, speed: 140, duration: 550, size: 0.16, gravity: 70 });
  }
}
