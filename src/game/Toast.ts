import Phaser from 'phaser';
import type { Axial } from '../engine/hex.js';

export interface ToastOptions {
  message: string;
  duration?: number;
  position?: { x: number; y: number };
  onDismiss?: () => void;
  onCenter?: () => void;
}

export class Toast {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Graphics;
  private dismissButton: Phaser.GameObjects.Text;
  private centerButton: Phaser.GameObjects.Text;
  private options: ToastOptions;
  private alive: boolean = true;

  constructor(scene: Phaser.Scene, options: ToastOptions) {
    this.scene = scene;
    this.options = options;
    
    this.createToast();
    this.setupInteractions();
    
    // Auto-dismiss after duration
    if (options.duration) {
      this.scene.time.delayedCall(options.duration, () => this.dismiss());
    }
  }

  private createToast() {
    const { x, y } = this.options.position || { x: 16, y: 16 };
    
    // Background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.lineStyle(2, 0xffffff, 0.6);
    this.background.fillRoundedRect(x, y, 300, 80, 8);
    this.background.strokeRoundedRect(x, y, 300, 80, 8);
    
    // Message text
    this.text = this.scene.add.text(x + 10, y + 10, this.options.message, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 280 }
    });
    
    // Dismiss button
    this.dismissButton = this.scene.add.text(x + 270, y + 10, '×', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setInteractive({ useHandCursor: true });
    
    // Center camera button
    this.centerButton = this.scene.add.text(x + 10, y + 50, 'Center Camera', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00'
    }).setInteractive({ useHandCursor: true });
    
    // Set depth to appear above other elements
    this.background.setDepth(1000);
    this.text.setDepth(1001);
    this.dismissButton.setDepth(1001);
    this.centerButton.setDepth(1001);
  }

  private setupInteractions() {
    // Dismiss button
    this.dismissButton.on('pointerdown', () => {
      this.dismiss();
      this.options.onDismiss?.();
    });
    
    // Center camera button
    this.centerButton.on('pointerdown', () => {
      this.options.onCenter?.();
    });
  }

  public dismiss() {
    if (!this.alive) return;
    
    this.alive = false;
    this.background.destroy();
    this.text.destroy();
    this.dismissButton.destroy();
    this.centerButton.destroy();
  }

  public isAlive(): boolean {
    return this.alive;
  }
}
