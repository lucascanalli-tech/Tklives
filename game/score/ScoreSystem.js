function getUserId(playerOrUserId) {
  if (typeof playerOrUserId === "string") {
    return playerOrUserId;
  }

  return playerOrUserId?.userId;
}

export class ScoreSystem {
  constructor(participants = []) {
    this.entries = new Map();
    this.listeners = new Set();
    this.nextOrder = 0;

    participants.forEach((participant) =>
      this.addParticipant(participant, false),
    );
  }

  addParticipant(participant, notify = true) {
    const userId = String(participant?.userId ?? "").trim();

    if (!userId) {
      return false;
    }

    const existing = this.entries.get(userId);

    if (existing) {
      const changed =
        participant.username && existing.username !== participant.username;
      existing.username = participant.username || existing.username;
      if (changed && notify) this.notify();
      return false;
    }

    this.entries.set(userId, {
      userId,
      username: participant.username,
      score: 0,
      order: this.nextOrder++,
      isBot: Boolean(participant.isBot),
    });

    if (notify) {
      this.notify();
    }

    return true;
  }

  registerKill(attacker, victim) {
    const attackerId = getUserId(attacker);
    const victimId = getUserId(victim);
    const attackerEntry = this.entries.get(attackerId);
    const victimEntry = this.entries.get(victimId);

    if (
      !attackerEntry ||
      !victimEntry ||
      attackerId === victimId ||
      !attacker?.isAlive?.()
    ) {
      return false;
    }

    attackerEntry.score += 1;
    this.notify();

    return true;
  }

  getScore(playerOrUserId) {
    const userId = getUserId(playerOrUserId);
    return this.entries.get(userId)?.score ?? 0;
  }

  getRanking(limit = null) {
    const ranking = Array.from(this.entries.values())
      .filter((entry) => !entry.isBot)
      .sort((a, b) => b.score - a.score || a.order - b.order);

    return Number.isInteger(limit) && limit > 0
      ? ranking.slice(0, limit)
      : ranking;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener();

    return () => this.listeners.delete(listener);
  }

  resetRound() {
    for (const entry of this.entries.values()) entry.score = 0;
    this.notify();
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }
}
