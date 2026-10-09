// Explicit rules only. Gift prices are never inferred from names.
export const GIFT_EFFECTS = {
  names: { rose: { tier: "small", energy: 8, heal: 3, color: 0xffc857 } },
  ids: {},
  fallback: { tier: "small", energy: 10, heal: 5, color: 0xffc857 },
  diamondTiers: [
    { minimum: 1000, tier: "special", energy: 70, heal: 40, color: 0xffe6a3 },
    { minimum: 100, tier: "medium", energy: 30, heal: 15, color: 0xffd56a },
  ],
};
export function getGiftEffect(data, config = GIFT_EFFECTS) {
  return (
    config.ids[data.giftId] ??
    config.names[data.giftName.toLowerCase()] ??
    (data.diamondCount == null
      ? null
      : config.diamondTiers.find((t) => data.diamondCount >= t.minimum)) ??
    config.fallback
  );
}
