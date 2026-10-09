import { ActivePlayerManager } from './ActivePlayerManager.js';
import {
  LOAD_TEST_ROTATION_MS,
  MAX_ACTIVE_PLAYERS,
  getLoadTestUserCount
} from '../config/GameConfig.js';
import { InteractionEffects } from '../effects/InteractionEffects.js';
import { EventBus } from '../events/EventBus.js';
import { EventLogView } from '../events/EventLogView.js';
import { EventSimulator } from '../events/EventSimulator.js';
import { LoadTestSimulator } from '../events/LoadTestSimulator.js';
import { WebSocketEventSource } from '../events/WebSocketEventSource.js';
import { ParticipantRegistry } from '../participants/ParticipantRegistry.js';
import { ParticipantStatsView } from '../participants/ParticipantStatsView.js';
import { RankingView } from '../score/RankingView.js';
import { ScoreSystem } from '../score/ScoreSystem.js';

const ARENA_MARGIN = 56;
const PANEL_MARGIN = 16;
const RANKING_WIDTH = 230;

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

    this.cameras.main.setBackgroundColor('#0f172a');
    this.drawArena();

    this.add
      .text(width / 2, 26, 'LIVE ARENA • v0.08.1', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setOrigin(0.5);

    this.participantRegistry = new ParticipantRegistry(MAX_ACTIVE_PLAYERS);
    this.scoreSystem = new ScoreSystem();
    this.activePlayerManager = new ActivePlayerManager(
      this,
      this.participantRegistry,
      this.scoreSystem,
      this.arenaBounds
    );

    this.rankingView = new RankingView(this, this.scoreSystem, {
      x: this.arenaBounds.right - RANKING_WIDTH - PANEL_MARGIN,
      y: this.arenaBounds.top + PANEL_MARGIN
    });

    this.participantStatsView = new ParticipantStatsView(
      this,
      this.participantRegistry,
      {
        x: this.arenaBounds.left + PANEL_MARGIN,
        y: this.arenaBounds.bottom - PANEL_MARGIN
      }
    );

    this.eventBus = new EventBus();

    this.unsubscribeParticipants = this.eventBus.subscribe((event) =>
      this.handleParticipantEvent(event)
    );

    this.eventLogView = new EventLogView(this, this.eventBus, {
      x: this.arenaBounds.left + PANEL_MARGIN,
      y: this.arenaBounds.top + PANEL_MARGIN
    });

    this.interactionEffects = new InteractionEffects(
      this,
      this.eventBus,
      (userId) => this.activePlayerManager.getPlayer(userId)
    );

    this.loadTestUserCount = getLoadTestUserCount();
    this.webSocketEventSource = new WebSocketEventSource(this.eventBus);

    if (this.loadTestUserCount === 0) {
      this.webSocketEventSource.start();
    }

    const simulatorEnabled =
      new URLSearchParams(window.location.search).get('simulator') !== 'off';

    this.eventSimulator =
      this.loadTestUserCount > 0
        ? new LoadTestSimulator(this.eventBus, {
            userCount: this.loadTestUserCount
          })
        : new EventSimulator(this.eventBus);

    if (simulatorEnabled) {
      this.eventSimulator.start();
    }

    if (this.loadTestUserCount > MAX_ACTIVE_PLAYERS) {
      this.loadRotationTimer = this.time.addEvent({
        delay: LOAD_TEST_ROTATION_MS,
        loop: true,
        callback: () => this.activePlayerManager.rotateOne()
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  handleParticipantEvent(event) {
    const { participant, isNew } = this.participantRegistry.register(event);

    if (!participant) {
      return;
    }

    this.scoreSystem.addParticipant(participant);

    if (isNew || participant.status === 'registered') {
      this.activePlayerManager.requestParticipant(participant);
    }
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

  update(time, delta) {
    this.activePlayerManager?.update(time, delta);
  }

  shutdown() {
    this.eventSimulator?.stop();
    this.webSocketEventSource?.stop();
    this.loadRotationTimer?.remove(false);
    this.loadRotationTimer = null;

    this.unsubscribeParticipants?.();
    this.unsubscribeParticipants = null;

    this.interactionEffects?.destroy();
    this.eventLogView?.destroy();
    this.rankingView?.destroy();
    this.participantStatsView?.destroy();
    this.activePlayerManager?.destroy();
    this.eventBus?.destroy();
  }
}
