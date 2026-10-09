import { ActivePlayerManager } from "./ActivePlayerManager.js";
import { LOAD_TEST_ROTATION_MS } from "../config/GameConfig.js";
import { getLayout } from "../config/LayoutConfig.js";
import { InteractionEffects } from "../effects/InteractionEffects.js";
import { VisualEffects } from "../effects/VisualEffects.js";
import { GiftEffects } from "../gifts/GiftEffects.js";
import { GiftManager } from "../gifts/GiftManager.js";
import { EventBus } from "../events/EventBus.js";
import { EventLogView } from "../events/EventLogView.js";
import { EventSimulator } from "../events/EventSimulator.js";
import { LoadTestSimulator } from "../events/LoadTestSimulator.js";
import { WebSocketEventSource } from "../events/WebSocketEventSource.js";
import { ParticipantRegistry } from "../participants/ParticipantRegistry.js";
import { ParticipantStatsView } from "../participants/ParticipantStatsView.js";
import { RankingView } from "../ranking/RankingView.js";
import { ScoreSystem } from "../score/ScoreSystem.js";
import { LiveHud } from "../hud/LiveHud.js";
import { BotManager } from "./BotManager.js";
import { RoundManager } from "./RoundManager.js";
export class ArenaScene extends Phaser.Scene {
  constructor(
    options = {
      mode: "SIMULATOR",
      layout: "landscape",
      maxActive: 100,
      load: 0,
      server: {},
    },
  ) {
    super("ArenaScene");
    this.options = options;
  }
  create() {
    const { width, height } = this.scale;
    this.layout = getLayout(width, height, this.options.layout === "portrait");
    const a = this.layout.arena;
    this.arenaBounds = new Phaser.Geom.Rectangle(a.x, a.y, a.width, a.height);
    this.drawArena();
    this.visualEffects = new VisualEffects(this);
    this.participantRegistry = new ParticipantRegistry(this.options.maxActive);
    this.scoreSystem = new ScoreSystem();
    this.activePlayerManager = new ActivePlayerManager(
      this,
      this.participantRegistry,
      this.scoreSystem,
      this.arenaBounds,
    );
    this.rankingView = new RankingView(
      this,
      this.scoreSystem,
      this.layout.ranking,
    );
    this.participantStatsView = new ParticipantStatsView(
      this,
      this.participantRegistry,
      this.layout.stats,
    );
    this.hud = new LiveHud(this, this.layout, this.options.mode);
    this.roundManager = new RoundManager({
      onStart: () => {
        this.scoreSystem.resetRound();
        for (const entry of this.activePlayerManager.entries.values())
          entry.health.respawn();
        this.hud.announce("");
      },
      onEnd: () => {
        const first = this.scoreSystem.getRanking(1)[0];
        this.hud.announce(
          first
            ? `RODADA ENCERRADA · ${first.username} · ${first.score} pontos`
            : "NOVA RODADA EM INSTANTES",
        );
      },
    });
    this.eventBus = new EventBus();
    this.unsubscribeParticipants = this.eventBus.subscribe((event) =>
      this.handleParticipantEvent(event),
    );
    this.eventLogView = new EventLogView(this, this.eventBus, {
      x: this.layout.ranking.x,
      y: this.layout.portrait ? 185 : 510,
      width: this.layout.ranking.width,
      visible: !this.layout.portrait,
      mode: this.options.mode,
    });
    this.interactionEffects = new InteractionEffects(
      this,
      this.eventBus,
      (id) => this.activePlayerManager.getPlayer(id),
    );
    this.giftEffects = new GiftEffects(this);
    this.giftManager = new GiftManager(this.eventBus, (event, config) => {
      const participant = this.participantRegistry.get(event.userId);
      if (participant)
        participant.giftUnits =
          (participant.giftUnits || 0) + event.data.quantity;
      const player = this.activePlayerManager.getPlayer(event.userId);
      if (player) {
        player.applyBonus({
          energy: config.energy * Math.min(event.data.quantity, 10),
          heal: config.heal * Math.min(event.data.quantity, 10),
          boost: config.tier === "special" ? 1.75 : 1.3,
          duration: 6000,
        });
        if (player.allowVisual("GIFT", 700))
          this.giftEffects.show(player, event, config);
      }
      this.hud.announce(
        `✦ ${event.username} · ${event.data.giftName} ×${event.data.quantity}${!player ? " · aguardando arena" : ""}`,
      );
      this.giftAnnouncementAt = Date.now();
    });
    this.loadTestUserCount = this.options.load;
    this.webSocketEventSource = new WebSocketEventSource(this.eventBus, null, {
      onStatus: (status) => this.hud.setStatus(status),
    });
    if (this.options.mode === "LIVE") this.webSocketEventSource.start();
    this.eventSimulator =
      this.options.load > 0
        ? new LoadTestSimulator(this.eventBus, { userCount: this.options.load })
        : new EventSimulator(this.eventBus);
    if (this.options.mode === "SIMULATOR") this.eventSimulator.start();
    if (this.options.bots) {
      this.botManager = new BotManager(this);
      this.botManager.update();
    }
    this.loadRotationTimer = this.time.addEvent({
      delay: LOAD_TEST_ROTATION_MS,
      loop: true,
      callback: () => this.activePlayerManager.rotateOne(),
    });
    this.botTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.botManager?.update(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }
  handleParticipantEvent(event) {
    if (!this.participantRegistry.get(event.userId))
      this.botManager?.makeRoom();
    const { participant, isNew } = this.participantRegistry.register(event);
    if (!participant) return;
    this.scoreSystem.addParticipant(participant);
    if (isNew || participant.status === "registered")
      this.activePlayerManager.requestParticipant(participant);
    this.activePlayerManager
      .getPlayer(participant.userId)
      ?.setUsername(participant.username);
  }
  drawArena() {
    const { width, height } = this.scale;
    const l = this.layout;
    const a = l.arena;
    this.cameras.main.setBackgroundColor("#06101f");
    const g = this.add.graphics();
    g.fillStyle(0x09172a).fillRoundedRect(a.x, a.y, a.width, a.height, 18);
    g.lineStyle(1, 0x15314a, 0.5);
    for (let x = a.left + 24; x < a.right; x += 36)
      g.lineBetween(x, a.top + 1, x, a.bottom - 1);
    for (let y = a.top + 24; y < a.bottom; y += 36)
      g.lineBetween(a.left + 1, y, a.right - 1, y);
    g.lineStyle(4, 0x38dbf8, 0.08).strokeRoundedRect(
      a.x - 3,
      a.y - 3,
      a.width + 6,
      a.height + 6,
      20,
    );
    g.lineStyle(1, 0x2b6c86, 0.85).strokeRoundedRect(
      a.x,
      a.y,
      a.width,
      a.height,
      18,
    );
    g.lineStyle(3, 0x57d4ff);
    for (const x of [a.left + 12, a.right - 42])
      for (const y of [a.top, a.bottom]) g.lineBetween(x, y, x + 30, y);
    g.lineStyle(1, 0x25485e, 0.5).strokeCircle(
      (a.left + a.right) / 2,
      (a.top + a.bottom) / 2,
      Math.min(a.width, a.height) * 0.27,
    );
    this.add
      .text(l.left, l.headerY, "LIVE ARENA", {
        fontFamily: "Arial, sans-serif",
        fontSize: l.portrait ? "32px" : "34px",
        fontStyle: "bold",
        color: "#f0faff",
        letterSpacing: 3,
      })
      .setDepth(30);
    this.add.text(
      a.left + 18,
      a.top + 16,
      "AUTONOMOUS BATTLE  /  NEON SECTOR",
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#517c99",
        letterSpacing: 2,
      },
    );
    this.add
      .text(width - l.left, height - (l.portrait ? 103 : 44), "v0.09", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#51728d",
      })
      .setOrigin(1, 1);
  }
  update(time, delta) {
    if (!this.roundManager) return;
    this.roundManager.update(delta, this.activePlayerManager.entries.size);
    this.activePlayerManager.update(time, delta);
    this.hud.update(this.roundManager);
    if (
      this.giftAnnouncementAt &&
      Date.now() - this.giftAnnouncementAt > 4000 &&
      this.roundManager.phase !== "BREAK"
    ) {
      this.hud.announce("");
      this.giftAnnouncementAt = 0;
    }
  }
  shutdown() {
    this.eventSimulator?.stop();
    this.webSocketEventSource?.stop();
    this.loadRotationTimer?.remove(false);
    this.botTimer?.remove(false);
    this.unsubscribeParticipants?.();
    this.interactionEffects?.destroy();
    this.giftManager?.destroy();
    this.eventLogView?.destroy();
    this.rankingView?.destroy();
    this.participantStatsView?.destroy();
    this.activePlayerManager?.destroy();
    this.visualEffects?.destroy();
    this.hud?.destroy();
    this.eventBus?.destroy();
  }
}
