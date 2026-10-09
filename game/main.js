import { ArenaScene } from "./arena/ArenaScene.js";
import { getGameOptions } from "./config/GameConfig.js";
let server = {};
try {
  const response = await fetch("/api/status");
  if (response.ok) server = await response.json();
} catch {
  console.warn(
    "[ARENA] Backend indisponível; use modo simulador explicitamente para testes locais.",
  );
}
const options = getGameOptions(window.location.search, server);
const portrait = options.layout === "portrait";
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#06101f",
  scene: [new ArenaScene(options)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: portrait ? 540 : 1280,
    height: portrait ? 960 : 720,
  },
});
