import { AutoCombat } from '../combat/AutoCombat.js';
import { HealthSystem } from '../health/HealthSystem.js';
import { AutoMovement } from '../movement/AutoMovement.js';
import { Player } from '../player/Player.js';

const ARENA_MARGIN = 56;

const TEST_PLAYERS = [
  { username: 'Lucas', x: 0.18, y: 0.28, color: 0x38bdf8 },
  { username: 'Maria', x: 0.5, y: 0.22, color: 0xf472b6 },
  { username: 'Joao', x: 0.78, y: 0.3, color: 0xfbbf24 },
  { username: 'Ana', x: 0.28, y: 0.66, color: 0x34d399 },
  { username: 'Bia', x: 0.58, y: 0.62, color: 0xa78bfa },
  { username: 'Rafa', x: 0.82, y: 0.72, color: 0xfb7185 }
];

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('ArenaScene');
  }

  create() {
    const { width, height } = this.scale;
    const arenaWidth = width - ARENA_MARGIN * 2;
    const arenaHeight = height - ARENA_MARGIN * 2;
    const arenaBounds = new Phaser.Geom.Rectangle(
      ARENA_MARGIN,
      ARENA_MARGIN,
      arenaWidth,
      arenaHeight
    );

    this.cameras.main.setBackgroundColor('#0f172a');

    const arena = this.add.graphics();
    arena.fillStyle(0x172033, 1);
    arena.fillRoundedRect(
      arenaBounds.x,
      arenaBounds.y,
      arenaBounds.width,
      arenaBounds.height,
      24
    );

    arena.lineStyle(4, 0x38bdf8, 1);
    arena.strokeRoundedRect(
      arenaBounds.x,
      arenaBounds.y,
      arenaBounds.width,
      arenaBounds.height,
      24
    );

    this.add
      .text(width / 2, 26, 'LIVE ARENA • v0.05', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setOrigin(0.5);

    this.players = TEST_PLAYERS.map(
      ({ username, x, y, color }) =>
        new Player(this, {
          username,
          x: arenaBounds.x + arenaBounds.width * x,
          y: arenaBounds.y + arenaBounds.height * y,
          color,
          bounds: arenaBounds
        })
    );

    this.healthSystems = this.players.map(
      (player) => new HealthSystem(this, player)
    );
    this.movements = this.players.map((player) => new AutoMovement(player));
    this.combats = this.players.map(
      (player) => new AutoCombat(this, player, () => this.players)
    );
  }

  update(time, delta) {
    this.movements?.forEach((movement) => movement.update(time, delta));
    this.combats?.forEach((combat) => combat.update(time));
    this.healthSystems?.forEach((health) => health.update());
  }
}
