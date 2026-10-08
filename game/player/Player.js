const PLAYER_RADIUS = 22;
const NAME_GAP = 10;
const TOP_LABEL_SPACE = 46;

function normalizeUsername(username) {
  return username.startsWith('@') ? username : `@${username}`;
}

export class Player {
  constructor(scene, { username, x, y, color, bounds }) {
    const safeX = Phaser.Math.Clamp(
      x,
      bounds.left + PLAYER_RADIUS,
      bounds.right - PLAYER_RADIUS
    );

    const safeY = Phaser.Math.Clamp(
      y,
      bounds.top + TOP_LABEL_SPACE,
      bounds.bottom - PLAYER_RADIUS
    );

    this.username = normalizeUsername(username);

    this.avatar = scene.add
      .circle(safeX, safeY, PLAYER_RADIUS, color)
      .setStrokeStyle(3, 0xf8fafc, 0.9);

    this.nameText = scene.add
      .text(safeX, safeY - PLAYER_RADIUS - NAME_GAP, this.username, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 4
      })
      .setOrigin(0.5, 1);
  }
}
