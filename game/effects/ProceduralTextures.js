export function createProceduralTextures(scene) {
  const draw = (name, paint, size = 64) => {
    const key = `vfx-${name}`; if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    paint(g); g.generateTexture(key, size, size); g.destroy();
  };
  draw("glow", g => {
    for (let r = 30; r >= 4; r -= 3) g.fillStyle(0xffffff, 0.035 + (30 - r) * 0.005).fillCircle(32, 32, r);
    g.fillStyle(0xffffff, 0.8).fillCircle(32, 32, 3);
  });
  draw("ring", g => {
    g.lineStyle(7, 0xffffff, 0.06).strokeCircle(32, 32, 25);
    g.lineStyle(2, 0xffffff, 0.95).strokeCircle(32, 32, 25);
    g.lineStyle(1, 0xffffff, 0.35).strokeCircle(32, 32, 21);
  });
  draw("spark", g => g.fillStyle(0xffffff).fillPoints([{x:32,y:4},{x:36,y:27},{x:49,y:32},{x:36,y:37},{x:32,y:60},{x:28,y:37},{x:15,y:32},{x:28,y:27}], true));
  draw("heart", g => {
    g.fillStyle(0xffffff).fillCircle(23, 24, 11).fillCircle(41, 24, 11);
    g.fillTriangle(12, 27, 52, 27, 32, 53);
  });
  draw("slash", g => {
    g.lineStyle(9, 0xffffff, 0.12).beginPath().arc(31, 33, 23, -1.5, 1.3).strokePath();
    g.lineStyle(3, 0xffffff, 0.95).beginPath().arc(31, 33, 23, -1.5, 1.3).strokePath();
  });
  draw("beam", g => {
    g.fillStyle(0xffffff, 0.07).fillRoundedRect(19, 0, 26, 64, 8);
    g.fillStyle(0xffffff, 0.15).fillRoundedRect(25, 0, 14, 64, 5);
    g.fillStyle(0xffffff, 0.75).fillRect(30, 0, 4, 64);
  });
}
