export class RankingView {
  constructor(
    scene,
    scoreSystem,
    { x, y, width = 238, limit = 10, compact = false },
  ) {
    this.scene = scene;
    this.scoreSystem = scoreSystem;
    this.x = x;
    this.y = y;
    this.width = width;
    this.limit = limit;
    this.rowHeight = compact ? 23 : 29;
    this.rows = [];
    this.previous = new Map();
    this.renderTimer = null;
    this.background = scene.add.graphics().setDepth(20);
    this.title = scene.add
      .text(x + 16, y + 15, "RANKING  /  TOP " + limit, {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffc857",
        letterSpacing: 2,
      })
      .setDepth(21);
    this.unsubscribe = scoreSystem.subscribe(() => this.scheduleRender());
  }
  scheduleRender() {
    if (this.renderTimer) return;
    this.renderTimer = this.scene.time.delayedCall(100, () => {
      this.renderTimer = null;
      this.render();
    });
  }
  render() {
    const entries = this.scoreSystem.getRanking(this.limit);
    const h = 50 + Math.max(1, entries.length) * this.rowHeight;
    this.background.clear();
    this.background
      .fillStyle(0x0a182a, 0.98)
      .fillRoundedRect(this.x, this.y, this.width, h, 12);
    this.background
      .lineStyle(1, 0x24415c)
      .strokeRoundedRect(this.x, this.y, this.width, h, 12);
    this.background
      .fillStyle(0xffc857)
      .fillRoundedRect(this.x + 16, this.y, 38, 3, 1);
    while (this.rows.length < entries.length) {
      this.rows.push(
        this.scene.add
          .text(this.x + 16, 0, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            color: "#b7cce0",
          })
          .setDepth(21),
      );
    }
    const next = new Map();
    this.rows.forEach((row, index) => {
      const entry = entries[index];
      if (!entry) {
        row.setText("");
        return;
      }
      const name =
        entry.username.length > 17
          ? entry.username.slice(0, 16) + "…"
          : entry.username;
      const y = this.y + 43 + index * this.rowHeight;
      row.setText(
        `${String(index + 1).padStart(2, "0")}   ${name}   ${entry.score}`,
      );
      row.setColor(index === 0 ? "#fff0bf" : "#b7cce0");
      const old = this.previous.get(entry.userId);
      if (old != null && old !== index) {
        this.scene.tweens.killTweensOf(row);
        row.setPosition(this.x + 20, y).setAlpha(0.5);
        this.scene.tweens.add({
          targets: row,
          x: this.x + 16,
          alpha: 1,
          duration: 220,
        });
      } else row.setY(y);
      next.set(entry.userId, index);
    });
    this.previous = next;
  }
  destroy() {
    this.unsubscribe?.();
    this.renderTimer?.remove(false);
    this.background.destroy();
    this.title.destroy();
    this.rows.forEach((row) => {
      this.scene.tweens.killTweensOf(row);
      row.destroy();
    });
    this.rows = [];
  }
}
