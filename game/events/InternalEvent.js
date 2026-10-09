export const EVENT_TYPES = Object.freeze([
  "JOIN",
  "COMMENT",
  "LIKE",
  "FOLLOW",
  "GIFT",
  "SHARE",
]);
const supported = new Set(EVENT_TYPES);
export function cleanText(value, limit = 200) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, limit);
}
export function positiveInteger(value, fallback = 1, maximum = 1000000) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.min(maximum, Math.floor(number)) || fallback
    : fallback;
}
// Both simulators and the server use this source-independent contract.
export function normalizeInternalEvent(input) {
  if (!input || typeof input !== "object") return null;
  const type = cleanText(input.type, 16).toUpperCase();
  const userId = cleanText(input.userId, 128);
  const name = cleanText(input.username, 40).replace(/^@+/, "");
  if (!supported.has(type) || !userId || !name) return null;
  const raw = input.data && typeof input.data === "object" ? input.data : input;
  let data = {};
  if (type === "COMMENT") {
    const message = cleanText(raw.message, 200);
    if (!message) return null;
    data = { message };
  } else if (type === "LIKE") {
    data = { count: positiveInteger(raw.count) };
  } else if (type === "GIFT") {
    const diamonds = Number(raw.diamondCount);
    data = {
      giftId: cleanText(raw.giftId, 80),
      giftName: cleanText(raw.giftName, 60) || "Gift desconhecido",
      quantity: positiveInteger(raw.quantity ?? raw.repeatCount),
      repeatCount: positiveInteger(raw.repeatCount ?? raw.quantity),
      repeatEnd: raw.repeatEnd === true,
      giftType: Number(raw.giftType) === 1 ? 1 : 0,
      groupId: cleanText(raw.groupId, 128),
      diamondCount:
        raw.diamondCount != null && Number.isFinite(diamonds) && diamonds >= 0
          ? diamonds
          : null,
    };
  }
  return Object.freeze({
    type,
    userId,
    username: `@${name}`,
    timestamp: positiveInteger(
      input.timestamp,
      Date.now(),
      Number.MAX_SAFE_INTEGER,
    ),
    eventId: cleanText(input.eventId, 128),
    data: Object.freeze(data),
  });
}
