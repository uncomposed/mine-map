import Phaser from 'phaser';
import { GameScene } from './game/GameScene.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#111318',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768
  },
  scene: [GameScene],
  physics: { default: 'arcade' },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  antialias: true
};

new Phaser.Game(config);
