import { ArenaScene } from './arena/ArenaScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0f172a',
  scene: [ArenaScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  }
};

new Phaser.Game(config);
