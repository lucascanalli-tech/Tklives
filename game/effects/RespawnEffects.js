export class RespawnEffects {
  constructor(manager) { this.manager = manager; }
  show(player, respawn = false) {
    const m = this.manager, { x, y } = player.avatar, color = respawn ? 0x57d4ff : player.color;
    if (!m.external(respawn ? "respawn" : "spawn", x, y, color, 650)) {
      const portal = m.sprite("ring", x, y + 16, color);
      m.track(portal, 650, (o, p) => o.setScale(0.45 + p * 1.1, 0.14 + p * 0.4).setAlpha((1 - p) * 0.85));
      const glow = m.sprite("glow", x, y, color);
      m.track(glow, 600, (o, p) => o.setScale(1.2 + p * 0.7).setAlpha((1 - p) * 0.55));
      m.ring(player, color, 28, 650);
    }
    m.particles.emit(x, y + 15, { count: 10, color, shape: "glow", speed: 100, duration: 600, size: 0.16, upward: true, gravity: -15 });
    m.fadeName(player);
  }
}
