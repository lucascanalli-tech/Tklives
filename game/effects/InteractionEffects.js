import { INTERACTIONS } from "../config/InteractionConfig.js";
export class InteractionEffects {
  constructor(scene, eventBus, getPlayerByUserId) {
    this.scene = scene;
    this.getPlayerByUserId = getPlayerByUserId;
    this.unsubscribe = eventBus.subscribe((event) => this.handleEvent(event));
  }
  handleEvent(event) {
    if (!INTERACTIONS[event.type] || event.type === "GIFT") return;
    const player = this.getPlayerByUserId(event.userId);
    if (!player) return;
    const config = INTERACTIONS[event.type];
    const quantity = event.type === "LIKE" ? Math.min(30, event.data.count) : 1;
    // Logical bonuses remain valid even when the visual budget drops an effect.
    player.applyBonus({
      energy: config.energy * quantity,
      heal: config.heal,
      boost: config.boost,
      duration: config.duration,
    });
    if (!player.allowVisual(event.type, config.cooldown)) return;
    this.scene.visualEffects.interaction(player, event);
  }
  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
