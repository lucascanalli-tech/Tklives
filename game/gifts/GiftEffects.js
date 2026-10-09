export class GiftEffects {
  constructor(scene) {
    this.scene = scene;
  }
  show(player, event, config) {
    const effects = this.scene.visualEffects;
    effects.ring(
      player,
      config.color,
      config.tier === "special" ? 70 : config.tier === "medium" ? 48 : 34,
      900,
    );
    effects.text(
      player,
      `✦ ${event.data.giftName} ×${event.data.quantity}`,
      "#ffe3a0",
      -76,
      1700,
    );
    if (config.tier === "special") {
      effects.ring(player, 0xffffff, 100, 1100);
      this.scene.cameras.main.flash(90, 50, 40, 0, false);
    }
  }
}
