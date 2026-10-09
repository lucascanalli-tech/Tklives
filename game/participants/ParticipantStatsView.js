export class ParticipantStatsView {
  constructor(scene, registry, { x, y }) {
    this.scene = scene;
    this.renderTimer = null;
    this.pendingStats = null;
    this.text = scene.add
      .text(x, y, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#819db9",
        letterSpacing: 1,
      })
      .setOrigin(0, 1)
      .setDepth(24);
    this.unsubscribe = registry.subscribe((stats) => {
      this.pendingStats = stats;
      if (this.renderTimer) return;
      this.renderTimer = scene.time.delayedCall(80, () => {
        this.renderTimer = null;
        const s = this.pendingStats;
        this.text.setText(
          `REGISTRADOS ${s.registered}  ·  ATIVOS ${s.active}/${s.maxActive}  ·  FILA ${s.queued}${s.bots ? "  ·  BOTS " + s.bots : ""}`,
        );
      });
    });
  }
  destroy() {
    this.unsubscribe?.();
    this.renderTimer?.remove(false);
    this.text.destroy();
  }
}
