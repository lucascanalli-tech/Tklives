export class ScoreSystem {
  constructor(players) {
    this.entries = new Map(
      players.map((player, index) => [
        player,
        {
          score: 0,
          order: index
        }
      ])
    );
    this.listeners = new Set();
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
