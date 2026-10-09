const UPDATE_DELAY = 80;

export class ParticipantStatsView {
  constructor(scene, registry, { x, y }) {
    this.scene = scene;
    this.registry = registry;
    this.pendingStats = null;
    this.renderTimer = null;

    this.text = scene.add
      .text(x, y, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#cbd5e1',
        backgroundColor: '#0f172acc',
        padding: { x: 8, y: 5 }
      })
      .setOrigin(0, 1)
      .setDepth(24);

    this.unsubscribe = registry.subscribe((stats) => this.scheduleRender(stats));
  }

  scheduleRender(stats) {
    this.pendingStats = stats;

    if (this.renderTimer) {
      return;
    }

    this.renderTimer = this.scene.time.delayedCall(UPDATE_DELAY, () => {
      this.renderTimer = null;
      this.render(this.pendingStats);
    });
  }

  render(stats) {
    if (!stats) {
      return;
    }

    this.text.setText(
      `REGISTRADOS ${stats.registered}  •  ATIVOS ${stats.active}/${stats.maxActive}  •  FILA ${stats.queued}`
    );
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.renderTimer?.remove(false);
    this.renderTimer = null;
    this.text.destroy();
  }
}
