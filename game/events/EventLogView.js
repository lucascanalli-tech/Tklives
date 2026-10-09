export class EventLogView {
  constructor(
    scene,
    eventBus,
    { x, y, width = 238, visible = true, mode = "SIMULATOR" },
  ) {
    this.scene = scene;
    this.events = [];
    this.renderTimer = null;
    this.rows = [];
    this.background = scene.add
      .rectangle(x, y, width, 168, 0x0a182a, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, 0x24415c)
      .setDepth(20)
      .setVisible(visible);
    this.title = scene.add
      .text(
        x + 16,
        y + 14,
        mode === "LIVE" ? "INTERAÇÕES" : "SIMULADOR / EVENTOS",
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#57d4ff",
          letterSpacing: 1,
        },
      )
      .setDepth(21)
      .setVisible(visible);
    for (let i = 0; i < 5; i++)
      this.rows.push(
        scene.add
          .text(x + 16, y + 40 + i * 23, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            color: "#8fa9c3",
          })
          .setDepth(21)
          .setVisible(visible),
      );
    this.unsubscribe = eventBus.subscribe((event) => this.addEvent(event));
  }
  addEvent(event) {
    const d = event.data;
    if (event.type === "GIFT" && d.giftType === 1 && !d.repeatEnd) return;
    const detail =
      event.type === "COMMENT"
        ? d.message.slice(0, 32)
        : event.type === "LIKE"
          ? `♥ +${d.count}`
          : event.type === "GIFT"
            ? `${d.giftName} ×${d.quantity}`
            : event.type;
    this.events.unshift(`${event.username.slice(0, 16)} · ${detail}`);
    this.events = this.events.slice(0, 5);
    if (!this.renderTimer)
      this.renderTimer = this.scene.time.delayedCall(80, () => {
        this.renderTimer = null;
        this.rows.forEach((row, i) => row.setText(this.events[i] ?? ""));
      });
  }
  destroy() {
    this.unsubscribe?.();
    this.renderTimer?.remove(false);
    this.background.destroy();
    this.title.destroy();
    this.rows.forEach((r) => r.destroy());
  }
}
