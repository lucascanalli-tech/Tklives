export class ScoreSystem {
  constructor(players = []) {
    this.entries = new Map();
    this.listeners = new Set();
    this.nextOrder = 0;

    players.forEach((player) => this.addPlayer(player, false));
  }

  addPlayer(player, notify = true) {
    if (!player || this.entries.has(player)) {
      return false;
    }

    this.entries.set(player, {
      score: 0,
      order: this.nextOrder++
    });

    if (notify) {
      this.notify();
    }

    return true;
  }

  registerKill(attacker, victim) {
    const attackerEntry = this.entries.get(attacker);
    const victimEntry = this.entries.get(victim);

    if (
      !attackerEntry ||
      !victimEntry ||
      attacker === victim ||
      !attacker.isAlive()
    ) {
      return false;
    }

    attackerEntry.score += 1;
    this.notify();
    return true;
  }

  getScore(player) {
    return this.entries.get(player)?.score ?? 0;
  }

  getRanking() {
    return Array.from(this.entries.entries())
      .map(([player, entry]) => ({
        player,
        username: player.username,
        score: entry.score,
        order: entry.order
      }))
      .sort((a, b) => b.score - a.score || a.order - b.order);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getRanking());

    return () => this.listeners.delete(listener);
  }

  notify() {
    const ranking = this.getRanking();
    this.listeners.forEach((listener) => listener(ranking));
  }
}
