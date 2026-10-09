import { AutoCombat } from '../combat/AutoCombat.js';
import { SpatialGrid } from '../combat/SpatialGrid.js';
import { COMBAT_CELL_SIZE } from '../config/GameConfig.js';
import { HealthSystem } from '../health/HealthSystem.js';
import { AutoMovement } from '../movement/AutoMovement.js';
import { Player } from '../player/Player.js';

const PLAYER_COLORS = [
  0x38bdf8,
  0xf472b6,
  0xfbbf24,
  0x34d399,
  0xa78bfa,
  0xfb7185
];

export class ActivePlayerManager {
  constructor(scene, registry, scoreSystem, arenaBounds) {
    this.scene = scene;
    this.registry = registry;
    this.scoreSystem = scoreSystem;
    this.arenaBounds = arenaBounds;
    this.entries = new Map();
    this.spatialGrid = new SpatialGrid(COMBAT_CELL_SIZE);
    this.nextColorIndex = 0;
  }

  requestParticipant(participant) {
    const result = this.registry.requestActivation(participant.userId);

    if (result.status === 'activated') {
      this.activate(result.participant);
    } else if (
      result.status === 'active' &&
      !this.entries.has(participant.userId)
    ) {
      this.activate(result.participant);
    }

    return result.status;
  }

  activate(participant) {
    if (this.entries.has(participant.userId)) {
      return this.entries.get(participant.userId).player;
    }

    const color =
      PLAYER_COLORS[this.nextColorIndex % PLAYER_COLORS.length];

    this.nextColorIndex += 1;

    const player = new Player(this.scene, {
      userId: participant.userId,
      username: participant.username,
      x: Phaser.Math.FloatBetween(
        this.arenaBounds.left + 120,
        this.arenaBounds.right - 120
      ),
      y: Phaser.Math.FloatBetween(
        this.arenaBounds.top + 100,
        this.arenaBounds.bottom - 60
      ),
      color,
      bounds: this.arenaBounds
    });

    const health = new HealthSystem(
      this.scene,
      player,
      (attacker, victim) => this.scoreSystem.registerKill(attacker, victim)
    );

    const movement = new AutoMovement(player);
    const combat = new AutoCombat(
      this.scene,
      player,
      () => this.spatialGrid.getNearby(player)
    );

    this.entries.set(participant.userId, {
      participant,
      player,
      health,
      movement,
      combat
    });

    return player;
  }

  getPlayer(userId) {
    return this.entries.get(String(userId))?.player;
  }

  update(time, delta) {
    const activeEntries = Array.from(this.entries.values());

    activeEntries.forEach(({ movement }) => movement.update(time, delta));

    this.spatialGrid.rebuild(
      activeEntries.map(({ player }) => player)
    );

    activeEntries.forEach(({ combat }) => combat.update(time));
    activeEntries.forEach(({ health }) => health.update());
  }

  release(userId, { requeue = false } = {}) {
    const key = String(userId);
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    entry.health.destroy();
    entry.player.destroy();
    this.entries.delete(key);

    const promoted = this.registry.releaseActive(key, { requeue });

    if (promoted) {
      this.activate(promoted);
    }

    return promoted;
  }

  rotateOne() {
    if (this.registry.getStats().queued === 0 || this.entries.size === 0) {
      return false;
    }

    const oldestActiveUserId = this.entries.keys().next().value;
    this.release(oldestActiveUserId, { requeue: true });

    return true;
  }

  destroy() {
    for (const { health, player } of this.entries.values()) {
      health.destroy();
      player.destroy();
    }

    this.entries.clear();
    this.spatialGrid.clear();
  }
}
