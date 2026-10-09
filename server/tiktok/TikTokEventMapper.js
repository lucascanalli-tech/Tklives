function normalizeUsername(username) {
  const value = String(username ?? '').trim();

  if (!value) {
    return '';
  }

  return value.startsWith('@') ? value : `@${value}`;
}

function getUser(data) {
  const user = data?.user ?? {};
  const username = normalizeUsername(
    user.uniqueId ?? data?.uniqueId ?? user.nickname
  );
  const userId = String(
    user.userId ?? user.id ?? user.secUid ?? user.uniqueId ?? ''
  ).trim();

  if (!userId || !username) {
    return null;
  }

  return { userId, username };
}

export function mapTikTokEvent(type, data) {
  const user = getUser(data);

  if (!user) {
    return null;
  }

  const baseEvent = {
    type,
    userId: user.userId,
    username: user.username,
    timestamp: Date.now()
  };

  switch (type) {
    case 'JOIN':
    case 'FOLLOW':
    case 'SHARE':
      return baseEvent;

    case 'COMMENT': {
      const message = String(data?.comment ?? '').trim();
      return message ? { ...baseEvent, message } : null;
    }

    case 'LIKE':
      return {
        ...baseEvent,
        count: Math.max(1, Number(data?.likeCount) || 1)
      };

    case 'GIFT': {
      const giftName = String(
        data?.giftDetails?.giftName ??
          data?.extendedGiftInfo?.name ??
          `Gift ${data?.giftId ?? ''}`
      ).trim();

      return {
        ...baseEvent,
        giftName: giftName || 'Gift',
        quantity: Math.max(1, Number(data?.repeatCount) || 1)
      };
    }

    default:
      return null;
  }
}
