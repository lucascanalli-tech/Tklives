export const VFX_SCENARIOS = Object.freeze([
  "Spawn", "Attack", "Hit", "Death", "Respawn", "Like", "Follow", "Share", "Comment",
  "COMMON", "RARE", "EPIC", "LEGENDARY",
]);

// Uses two unregistered visual actors. No EventBus, damage, bonuses or score.
export function playVfxScenario(name, effects, [player, target]) {
  if (name === "Spawn") effects.spawn(player);
  if (name === "Attack") effects.attack(player, target);
  if (name === "Hit") effects.hit(target, 20);
  if (name === "Death") effects.death(target);
  if (name === "Respawn") effects.respawn(target);
  if (["Like", "Follow", "Share", "Comment"].includes(name)) effects.interaction(player, {
    type: name.toUpperCase(), data: { count: 100, message: "Mensagem de demonstração VFX" },
  });
  if (["COMMON", "RARE", "EPIC", "LEGENDARY"].includes(name)) effects.gift(player, {
    data: { giftName: `DEMO ${name}`, quantity: 3 },
  }, name);
}
