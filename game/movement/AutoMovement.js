const MIN_SPEED = 70;
const MAX_SPEED = 110;
const MIN_DIRECTION_TIME = 900;
const MAX_DIRECTION_TIME = 2200;

export class AutoMovement {
  constructor(player) {
    this.player = player;
    this.speed = Phaser.Math.FloatBetween(MIN_SPEED, MAX_SPEED);
    this.direction = new Phaser.Math.Vector2();
    this.nextDirectionChange = 0;

    this.chooseDirection(0);
  }

  chooseDirection(time) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.direction.set(Math.cos(angle), Math.sin(angle));
    this.nextDirectionChange =
      time + Phaser.Math.Between(MIN_DIRECTION_TIME, MAX_DIRECTION_TIME);
  }

  update(time, delta) {
    if (time >= this.nextDirectionChange) {
      this.chooseDirection(time);
    }

    const distance = this.speed * (delta / 1000);
    const bounds = this.player.getMovementBounds();

    let nextX = this.player.avatar.x + this.direction.x * distance;
    let nextY = this.player.avatar.y + this.direction.y * distance;

    if (nextX <= bounds.left || nextX >= bounds.right) {
      this.direction.x *= -1;
      nextX = Phaser.Math.Clamp(nextX, bounds.left, bounds.right);
    }

    if (nextY <= bounds.top || nextY >= bounds.bottom) {
      this.direction.y *= -1;
      nextY = Phaser.Math.Clamp(nextY, bounds.top, bounds.bottom);
    }

    this.player.setPosition(nextX, nextY);
  }
}
