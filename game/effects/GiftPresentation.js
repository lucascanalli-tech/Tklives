import { GIFT_VISUALS, getVisualGiftTier } from "../config/GiftVisualConfig.js";
import { PresentationQueue } from "./PresentationQueue.js";

export class GiftPresentation {
  constructor(manager) {
    this.manager = manager;
    this.queue = new PresentationQueue((snapshot, duration) => manager.screen.begin(snapshot, duration), () => manager.screen.stop());
  }
  show(player, event, overrideTier = null) {
    const m = this.manager, tier = overrideTier ?? getVisualGiftTier(event.data), config = GIFT_VISUALS[tier];
    if (!config) return;
    const { x, y } = player.avatar, { color, duration } = config;
    if (!m.external(`gift.${tier.toLowerCase()}`, x, y, color, duration)) {
      m.ring(player, color, 32 + config.priority * 12, duration);
      if (config.priority >= 1) {
        m.ring(player, color, 52 + config.priority * 9, duration);
        const beam = m.sprite("beam", x, y - 42, color);
        m.track(beam, Math.min(duration, 1000), (o, p) => o.setScale(0.65 + p * 0.25, 1.8 + p * 0.5).setAlpha(Math.sin(p * Math.PI) * 0.4));
      }
      if (config.priority >= 2) {
        const aura = m.sprite("glow", x, y, color);
        m.track(aura, duration, (o, p) => o.setScale(2.4 + p).setAlpha((1 - p) * 0.4));
      }
    }
    m.particles.emit(x, y, { count: 8 + config.priority * 8, color, speed: 85 + config.priority * 20,
      duration: Math.min(950, duration), size: 0.15, upward: tier !== "LEGENDARY" });
    m.text(player, `${event.data.giftName.slice(0, 32)} ×${event.data.quantity}`, `#${color.toString(16).padStart(6, "0")}`, -84, 1200, `gift:${player.userId}`);
    if (config.priority >= 2) this.queue.enqueue({ tier, giftName: event.data.giftName.slice(0, 32),
      username: player.username.slice(0, 40), quantity: event.data.quantity }, config.priority, duration);
  }
  update(delta) { this.queue.update(delta); }
  destroy() { this.queue.destroy(); }
}
