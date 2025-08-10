import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // placeholder for assets
  }

  create() {
    const text = this.add.text(16, 16, 'mine-map: boot OK', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#e6e6e6'
    });
    text.setDepth(1000);
  }
}
