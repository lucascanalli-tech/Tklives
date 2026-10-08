import { AutoCombat } from '../combat/AutoCombat.js';
import { EventBus } from '../events/EventBus.js';
import { EventLogView } from '../events/EventLogView.js';
import { EventSimulator } from '../events/EventSimulator.js';
import { HealthSystem } from '../health/HealthSystem.js';
import { AutoMovement } from '../movement/AutoMovement.js';
import { Player } from '../player/Player.js';
import { RankingView } from '../score/RankingView.js';
import { ScoreSystem } from '../score/ScoreSystem.js';

const ARENA_MARGIN = 56;
const PANEL_MARGIN = 16;
const RANKING_WIDTH = 230;
const PLAYER_COLORS = [
  0x38bdf8,
  0xf472b6,
  0xfbbf24,
  0x34d399,
  0xa78bfa,
  0xfb7185
];

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('ArenaScene');
  }

  create() {
    const { width, height } = this.scale;
    const arenaWidth = width - ARENA_MARGIN * 2;
    const arenaHeight = height - ARENA_MARGIN * 2;

    this.arenaBounds = new Phaser.Geom.Rectangle(
      ARENA_MARGIN,
      ARENA_MARGIN,
      arenaWidth,
      arenaHeight
    );

    this.players = [];
    this.playersByUserId = new Map();
    this.healthSystems = [];
    this.movements = [];
    this.combats = [];

    this.cameras.main.setBackgroundColor('#0f172a');
    this.drawArena();

    this.add
      .text(width / 2, 26, 'LIVE ARENA • v0.07', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setOrigin(0.5);

    this.scoreSystem = new ScoreSystem();
    this.rankingView = new RankingView(this, this.scoreSystem, {
      x: this.arenaBounds.right - RANKING_WIDTH - PANEL_MARGIN,
      y: this.arenaBounds.top + PANEL_MARGIN
    });

    this.eventBus = new EventBus();
    this.eventLogView = new EventLogView(this, this.eventBus, {
      x: this.arenaBounds.left + PANEL_MARGIN,
      y: this.arenaBounds.top + PANEL_MARGIN
    });

    this.unsubscribeJoin = this.eventBus.on('JOIN', (event) =>
      this.addPlayerFromJoin(event)
    );

    this.eventSimulator = new EventSimulator(this.eventBus);
    this.eventSimulator.start();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.eventSimulator.stop();
      this.unsubscribeJoin?.();
      this.eventLogView.unsubscribe?.();
    });
  }

  drawArena() {
    const arena = this.add.graphics();
    arena.fillStyle(0x172033, 1);
    arena.fillRoundedRect(
      this.arenaBounds.x,
      this.arenaBounds.y,
      this.arenaBounds.width,
      this.arenaBounds.height,
      24
    );

    arena.lineStyle(4, 0x38bdf8, 1);
    arena.strokeRoundedRect(
      this.arenaBounds.x,
      this.arenaBounds.y,
      this.arenaBounds.width,
      this.arenaBounds.height,
      24
    );
  }

  addPlayerFromJoin(event) {
    if (this.playersByUserId.has(event.userId)) {
      return this.playersByUserId.get(event.userId);
    }

    const color = PLAYER_COLORS[this.players.length % PLAYER_COLORS.length];
    const player = new Player(this, {
      username: event.username,
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

    this.players.push(player);
    this.playersByUserId.set(event.userId, player);
    this.scoreSystem.addPlayer(player);

    const health = new HealthSystem(this, player, (attacker, victim) =>
      this.scoreSystem.registerKill(attacker, victim)
    );

    this.healthSystems.push(health);
    this.movements.push(new AutoMovement(player));
    this.combats.push(new AutoCombat(this, player, () => this.players));

    return player;
  }

  update(time, delta) {
    this.movements.forEach((movement) => movement.update(time, delta));
    this.combats.forEach((combat) => combat.update(time));
    this.healthSystems.forEach((health) => health.update());
  }
}
