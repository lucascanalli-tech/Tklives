import { normalizeInternalEvent } from "../../game/events/InternalEvent.js";
export function mapTikTokEvent(type, raw) {
  const user = raw?.user ?? {};
  // A mutable username must never serve as an identity fallback.
  const userId = user.userId ?? user.id ?? user.secUid ?? raw?.userId;
  const username = user.uniqueId ?? raw?.uniqueId ?? user.nickname;
  const gift = raw?.giftDetails ?? {};
  const extended = raw?.extendedGiftInfo ?? {};
  return normalizeInternalEvent({
    type,
    userId,
    username,
    timestamp: Date.now(),
    eventId: raw?.common?.msgId ?? raw?.msgId,
    data: {
      message: raw?.comment,
      count: raw?.likeCount,
      giftId: raw?.giftId ?? gift.giftId,
      giftName: gift.giftName ?? extended.name,
      quantity: raw?.repeatCount,
      repeatCount: raw?.repeatCount,
      repeatEnd: raw?.repeatEnd,
      giftType: gift.giftType ?? raw?.giftType,
      groupId: raw?.groupId,
      diamondCount: gift.diamondCount ?? extended.diamondCount,
    },
  });
}
