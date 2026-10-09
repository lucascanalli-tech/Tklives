const labels = {
  CONNECTING: "CONECTANDO",
  CONNECTED: "TIKTOK CONECTADO",
  DISCONNECTED: "TIKTOK DESCONECTADO",
  RECONNECTING: "RECONECTANDO",
  ERROR: "ERRO DE CONEXÃO",
};
export class LiveHud {
  constructor(scene, layout, mode) {
    this.scene = scene;
    this.layout = layout;
    this.mode = mode;
    this.status = scene.add
      .text(layout.left, layout.headerY + 52, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#7fffd2",
        letterSpacing: 2,
      })
      .setDepth(30);
    this.round = scene.add
      .text(layout.right, layout.headerY + 8, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#e8f6ff",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(30);
    this.message = scene.add
      .text(scene.scale.width / 2, layout.headerY + 82, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#ffc857",
        align: "center",
        wordWrap: { width: scene.scale.width - 80 },
      })
      .setOrigin(0.5, 0)
      .setDepth(30);
    this.lastSecond = -1;
    this.statusInfo = {};
    this.setStatus(scene.options.server);
  }
  setStatus(next) {
    this.statusInfo = { ...this.statusInfo, ...next };
    if (this.mode === "SIMULATOR") {
      this.status.setText("● SIMULATOR MODE · SEM LIVE REAL");
      this.status.setColor("#57d4ff");
      return;
    }
    const state =
      this.statusInfo.transport === "RECONNECTING"
        ? "RECONNECTING"
        : this.statusInfo.state || "DISCONNECTED";
    this.status.setText(`● ${labels[state] || "TIKTOK DESCONECTADO"}`);
    this.status.setColor(
      state === "CONNECTED"
        ? "#7fffd2"
        : state === "ERROR"
          ? "#ff638e"
          : "#ffc857",
    );
  }
  update(round) {
    const second = Math.ceil(round.remaining / 1000);
    if (second === this.lastSecond && round.phase === this.lastPhase) return;
    this.lastSecond = second;
    this.lastPhase = round.phase;
    const time = `${Math.floor(second / 60)
      .toString()
      .padStart(2, "0")}:${(second % 60).toString().padStart(2, "0")}`;
    this.round.setText(
      round.phase === "WAITING"
        ? "AGUARDANDO\nJOGADORES"
        : `RODADA ${String(round.number).padStart(2, "0")}\n${round.phase === "BREAK" ? "PRÓXIMA EM " : ""}${time}`,
    );
  }
  announce(text) {
    const limit = this.layout.portrait ? 50 : 100;
    this.message.setText(
      text.length > limit ? text.slice(0, limit - 1) + "…" : text,
    );
  }
  destroy() {
    this.status.destroy();
    this.round.destroy();
    this.message.destroy();
  }
}
