// Adapter kept at the existing gameplay call site.
export class GiftEffects {
  constructor(scene) { this.scene = scene; }
  show(player, event) { this.scene.visualEffects.gift(player, event); }
}
