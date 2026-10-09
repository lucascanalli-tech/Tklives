export class InteractionPresentation {
  constructor(manager) { this.manager = manager; }
  show(player, event) {
    const m = this.manager, { x, y } = player.avatar;
    if (event.type === "COMMENT") {
      const comments = [...m.channels.keys()].filter(key => key.startsWith("comment:"));
      if (comments.length >= 6 && !m.channels.has(`comment:${player.userId}`)) return;
      m.external("comment", x, y - 58, 0xe8f6ff, 700);
      m.text(player, `“${event.data.message.slice(0, 64)}”`, "#e8f6ff", -86, 2200, `comment:${player.userId}`);
    }
    if (event.type === "LIKE") {
      m.external("like", x, y - 18, 0xff7bba, 650);
      m.particles.emit(x, y - 18, { count: Math.min(5, 2 + Math.floor(Math.sqrt(event.data.count) / 5)),
        shape: "heart", color: 0xff7bba, speed: 65, upward: true, gravity: -10, size: 0.21, duration: 780 });
      m.text(player, `♥ +${event.data.count}`, "#ff8cc4", -67, 850, `like:${player.userId}`);
    }
    if (event.type === "FOLLOW") {
      if (!m.external("follow", x, y, 0x57f5bc, 900)) {
        m.ring(player, 0x57f5bc, 40, 900);
        const aura = m.sprite("glow", x, y, 0x57f5bc);
        m.track(aura, 900, (o, p) => o.setScale(1.6 + p).setAlpha((1 - p) * 0.45));
      }
      m.particles.emit(x, y, { count: 12, color: 0x57f5bc, size: 0.14, duration: 700, speed: 95 });
      m.text(player, "NOVO FOLLOW", "#7fffd2", -76, 1300, `follow:${player.userId}`);
    }
    if (event.type === "SHARE") {
      if (!m.external("share", x, y, 0x57d4ff, 800)) {
        m.ring(player, 0x57d4ff, 43, 650); m.ring(player, 0x91e6ff, 63, 850);
      }
      m.particles.emit(x, y, { count: 7, color: 0x57d4ff, shape: "glow", size: 0.2, speed: 100, duration: 650 });
      m.text(player, "SHARE ↑", "#91e6ff", -76, 1200, `share:${player.userId}`);
    }
  }
}
