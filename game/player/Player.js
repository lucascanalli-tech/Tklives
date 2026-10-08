const PLAYER_RADIUS = 22;
const NAME_GAP = 10;
const HEALTH_BAR_Y_OFFSET = 62;
const TOP_UI_SPACE = 68;

function normalizeUsername(username) {
  return username.startsWith('@') ? username : `@${username}`;
}

export class Player {
  constructor(scene, { username, x, y, color, bounds }) {
    this.bounds = bounds;
    this.username = normalizeUsername(username);
    this.alive = true;

    const movementBounds = this.getMovementBounds();
    const safeX = Phaser.Math.Clamp(x, movementBounds.left, movementBounds.right);
    const safeY = Phaser.Math.Clamp(y, movementBounds.top, movementBounds.bottom);

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

  getMovementBounds() {
    return {
      left: this.bounds.left + PLAYER_RADIUS,
      right: this.bounds.right - PLAYER_RADIUS,
      top: this.bounds.top + TOP_UI_SPACE,
      bottom: this.bounds.bottom - PLAYER_RADIUS
    };
  }

  getHealthBarPosition() {
    return {
      x: this.avatar.x,
      y: this.avatar.y - HEALTH_BAR_Y_OFFSET
    };
  }

  isAlive() {
    return this.alive;
  }

  setAlive(alive) {
    this.alive = alive;
    this.avatar.setVisible(alive);
    this.nameText.setVisible(alive);
  }

  setPosition(x, y) {
    const movementBounds = this.getMovementBounds();
    const safeX = Phaser.Math.Clamp(x, movementBounds.left, movementBounds.right);
    const safeY = Phaser.Math.Clamp(y, movementBounds.top, movementBounds.bottom);

    this.avatar.setPosition(safeX, safeY);
    this.nameText.setPosition(safeX, safeY - PLAYER_RADIUS - NAME_GAP);
  }
}
