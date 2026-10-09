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
    const fx = this.scene.visualEffects;
    if (event.type === "COMMENT")
      fx.text(
        player,
        `“${event.data.message.slice(0, 64)}”`,
        "#e8f6ff",
        -72,
        2200,
      );
    if (event.type === "LIKE")
      fx.text(player, `♥ +${event.data.count}`, "#ff7bba", -58, 850);
    if (event.type === "FOLLOW") {
      fx.ring(player, 0x57f5bc);
      fx.text(player, "NOVO FOLLOW", "#7fffd2");
    }
    if (event.type === "SHARE") {
      fx.ring(player, 0x57d4ff, 45);
      fx.text(player, "SHARE ↑", "#91e6ff");
    }
  }
  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
