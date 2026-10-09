// These tiers are presentation only. GiftConfig.js still owns every bonus.
export const GIFT_VISUALS = Object.freeze({
  COMMON: { priority: 0, color: 0xffc857, duration: 650 },
  RARE: { priority: 1, color: 0x79d9ff, duration: 1000 },
  EPIC: { priority: 2, color: 0xd99aff, duration: 1400 },
  LEGENDARY: { priority: 3, color: 0xffe6a3, duration: 1800 },
});
export const GIFT_VISUAL_NAMES = Object.freeze({
  rose: "COMMON", "finger heart": "RARE", galaxy: "EPIC", lion: "LEGENDARY",
});
export const GIFT_VISUAL_IDS = Object.freeze({});
export function getVisualGiftTier(data = {}) {
  const named = GIFT_VISUAL_IDS[String(data.giftId)] || GIFT_VISUAL_NAMES[String(data.giftName || "").trim().toLowerCase()];
  if (named) return named;
  const diamonds = Number(data.diamondCount);
  if (Number.isFinite(diamonds) && diamonds >= 1000) return "LEGENDARY";
  if (Number.isFinite(diamonds) && diamonds >= 500) return "EPIC";
  if (Number.isFinite(diamonds) && diamonds >= 100) return "RARE";
  return "COMMON";
}
