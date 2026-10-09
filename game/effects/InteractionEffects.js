const FLOAT_DURATION = 1200;
const RING_DURATION = 850;
const MAX_COMMENT_LENGTH = 60;

export class InteractionEffects {
  constructor(scene, eventBus, getPlayerByUserId) {
    this.scene = scene;
    this.getPlayerByUserId = getPlayerByUserId;
    this.unsubscribe = eventBus.subscribe((event) => this.handleEvent(event));
  }

  handleEvent(event) {
    if (event.type === 'JOIN') {
      return;
    }

    const player = this.getPlayerByUserId(event.userId);

    if (!player) {
      return;
    }

    switch (event.type) {
      case 'COMMENT':
        this.showComment(player, event);
        break;
      case 'LIKE':
        this.showLike(player, event);
        break;
      case 'FOLLOW':
        this.showFollow(player);
        break;
      case 'GIFT':
        this.showGift(player, event);
        break;
      case 'SHARE':
        this.showShare(player);
        break;
      default:
        break;
    }
  }

  showComment(player, event) {
    const message = String(event.message ?? '').trim().slice(0, MAX_COMMENT_LENGTH);

    if (!message) {
      return;
    }

    this.createFloatingText(player, `“${message}”`, {
      color: '#f8fafc',
      backgroundColor: '#0f172acc',
      yOffset: -82,
      fontSize: '16px'
    });
  }

  showLike(player, event) {
    const count = Math.max(1, Number(event.count) || 1);

    this.createFloatingText(player, `♥ +${count}`, {
      color: '#fb7185',
      yOffset: -72,
      fontSize: '20px'
    });
  }

  showFollow(player) {
    this.createRing(player, 0x34d399, 34);
    this.createFloatingText(player, 'NOVO FOLLOW', {
      color: '#6ee7b7',
      yOffset: -78,
      fontSize: '17px'
    });
  }

  showGift(player, event) {
    const giftName = String(event.giftName ?? 'Gift').trim() || 'Gift';
    const quantity = Math.max(1, Number(event.quantity) || 1);

    this.createRing(player, 0xfbbf24, 38, 0);
    this.createRing(player, 0xfde047, 50, 120);
    this.createFloatingText(player, `GIFT • ${giftName} x${quantity}`, {
      color: '#fde047',
      yOffset: -84,
      fontSize: '19px',
      duration: 1500
    });
  }

  showShare(player) {
    this.createRing(player, 0x38bdf8, 30, 0);
    this.createRing(player, 0x7dd3fc, 42, 140);
    this.createFloatingText(player, 'SHARE', {
      color: '#7dd3fc',
      yOffset: -76,
      fontSize: '18px'
    });
  }

  createFloatingText(
    player,
    text,
    {
      color = '#f8fafc',
      backgroundColor,
      yOffset = -76,
      fontSize = '18px',
      duration = FLOAT_DURATION
    } = {}
  ) {
    const style = {
      fontFamily: 'Arial, sans-serif',
      fontSize,
      fontStyle: 'bold',
      color,
      stroke: '#0f172a',
      strokeThickness: 4,
      padding: { x: 5, y: 3 }
    };

    if (backgroundColor) {
      style.backgroundColor = backgroundColor;
    }

    const label = this.scene.add
      .text(player.avatar.x, player.avatar.y + yOffset, text, style)
      .setOrigin(0.5)
      .setDepth(10);

    this.scene.tweens.add({
      targets: label,
      y: label.y - 34,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }

  createRing(player, color, radius, delay = 0) {
    const ring = this.scene.add
      .circle(player.avatar.x, player.avatar.y, radius, 0xffffff, 0)
      .setStrokeStyle(3, color, 0.95)
      .setScale(0.65)
      .setDepth(9);

    this.scene.tweens.add({
      targets: ring,
      scale: 1.75,
      alpha: 0,
      duration: RING_DURATION,
      delay,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
