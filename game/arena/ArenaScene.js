const ARENA_MARGIN = 56;

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('ArenaScene');
  }

  create() {
    const { width, height } = this.scale;
    const arenaWidth = width - ARENA_MARGIN * 2;
    const arenaHeight = height - ARENA_MARGIN * 2;

    this.cameras.main.setBackgroundColor('#0f172a');

    const arena = this.add.graphics();
    arena.fillStyle(0x172033, 1);
    arena.fillRoundedRect(
      ARENA_MARGIN,
      ARENA_MARGIN,
      arenaWidth,
      arenaHeight,
      24
    );

    arena.lineStyle(4, 0x38bdf8, 1);
    arena.strokeRoundedRect(
      ARENA_MARGIN,
      ARENA_MARGIN,
      arenaWidth,
      arenaHeight,
      24
    );

    this.add
      .text(width / 2, height / 2 - 18, 'LIVE ARENA', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#f8fafc'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 34, 'v0.01 • Arena básica', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#94a3b8'
      })
      .setOrigin(0.5);
  }
}
