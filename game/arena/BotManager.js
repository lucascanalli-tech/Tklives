export class BotManager {
  constructor(scene, target = 6) {
    this.scene = scene;
    this.target = Math.min(target, scene.participantRegistry.maxActivePlayers);
  }
  update() {
    const { participantRegistry: registry, activePlayerManager: manager } =
      this.scene;
    const realActive = [...registry.activeUserIds].filter(
      (id) => !registry.get(id).isBot,
    ).length;
    const desired = Math.max(0, this.target - realActive);
    const bots = [...registry.activeUserIds].filter(
      (id) => registry.get(id).isBot,
    );
    while (bots.length > desired) this.remove(bots.pop());
    for (let index = 0; index < this.target && bots.length < desired; index++) {
      const id = `bot:${index}`;
      if (registry.get(id)) continue;
      const { participant } = registry.register({
        userId: id,
        username: `@BOT-${String(index + 1).padStart(2, "0")}`,
        timestamp: Date.now(),
        type: "JOIN",
      });
      participant.isBot = true;
      this.scene.scoreSystem.addParticipant(participant);
      manager.requestParticipant(participant);
      bots.push(id);
    }
  }
  remove(id) {
    this.scene.activePlayerManager.release(id);
    this.scene.participantRegistry.removeBot(id);
    this.scene.scoreSystem.entries.delete(id);
  }
  makeRoom() {
    const registry = this.scene.participantRegistry;
    if (registry.activeUserIds.size < registry.maxActivePlayers) return;
    const id = [...registry.activeUserIds].find(
      (key) => registry.get(key).isBot,
    );
    if (id) this.remove(id);
  }
}
