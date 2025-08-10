import Phaser from 'phaser';
import { generateMovement } from './MapGen.js';
import type { Axial, Layout } from '../engine/hex.js';
import { pixelToAxial, axialToPixel, axialDistance } from '../engine/hex.js';
import { enablePanZoom } from './InputCamera.js';
import { Token } from './Token.js';
import { Toast } from './Toast.js';
import { FogOfWar } from './FogOfWar.js';
import { drawHex } from './HexTile.js';

export class GameScene extends Phaser.Scene {
  private layout!: Layout;
  private map = generateMovement({ width: 60, height: 60, seed: 'alpha-001' });
  private token!: Token;
  private fogOfWar!: FogOfWar;
  private toasts: Toast[] = [];
  private hoveredTile: Axial | null = null;
  private tileInfoPanel: Phaser.GameObjects.Container | null = null;

  constructor() { super('GameScene'); }

  create() {
    this.layout = { hexSize: 18, originX: 100, originY: 100 };
    enablePanZoom(this);

    // Initialize token at center of map
    const centerQ = Math.floor(this.map.w / 2);
    const centerR = Math.floor(this.map.h / 2);
    this.token = new Token({ q: centerQ, r: centerR }, 5);

    // Initialize fog of war
    this.fogOfWar = new FogOfWar(this, this.map.w, this.map.h, 3);
    this.fogOfWar.updateTokenPosition(this.token.position);

    // initial draw
    this.redraw();

    // Create tile info panel
    this.createTileInfoPanel();

    // Add hover detection
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const world = this.cameras.main.getWorldPoint(p.x, p.y);
      const a = pixelToAxial(world.x, world.y, this.layout);
      if (a.q >= 0 && a.r >= 0 && a.q < this.map.w && a.r < this.map.h) {
        this.hoveredTile = a;
        this.updateTileInfoPanel();
      } else {
        this.hoveredTile = null;
        this.hideTileInfoPanel();
      }
    });

    // click to select a tile or move token
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const world = this.cameras.main.getWorldPoint(p.x, p.y);
      const a = pixelToAxial(world.x, world.y, this.layout);
      if (a.q < 0 || a.r < 0 || a.q >= this.map.w || a.r >= this.map.h) return;
      
      // Check if clicking on token position
      if (a.q === this.token.position.q && a.r === this.token.position.r) {
        // Show token info
        this.showTokenInfo();
      } else {
        // Try to move token
        this.tryMoveToken(a);
      }
    });
  }

  private tryMoveToken(targetPosition: Axial) {
    if (!this.token.isAlive()) return;

    // Check if target is within movement range (1 tile for now)
    const distance = axialDistance(targetPosition, this.token.position);
    
    if (distance > 1) {
      this.showToast('Cannot move that far! (Max 1 tile)', 2000);
      return;
    }

    // Check if target is the same position
    if (distance === 0) {
      this.showToast('Already at this position!', 2000);
      return;
    }

    // Move token
    if (this.token.moveTo(targetPosition)) {
      // Mine the tile
      const idx = targetPosition.r * this.map.w + targetPosition.q;
      const tileValue = this.map.move[idx]!;
      
      if (this.token.mine(tileValue)) {
        // Token survived mining
        this.showToast(`Mined ${tileValue} MP! Current MP: ${this.token.getMp()}`, 2000);
      } else {
        // Token died
        this.showToast('Token died from mining!', 5000, () => {
          // Center camera on death position
          const pixelPos = axialToPixel(this.token.position, this.layout);
          this.cameras.main.centerOn(pixelPos.x, pixelPos.y);
        });
      }

      // Update fog of war
      this.fogOfWar.updateTokenPosition(this.token.position);
      
      // Redraw
      this.redraw();
    } else {
      this.showToast('Not enough MP to move!', 2000);
    }
  }

  private showTokenInfo() {
    const info = `Token: MP=${this.token.getMp()}, Pos=(${this.token.position.q},${this.token.position.r})`;
    this.showToast(info, 3000);
  }

  private createTileInfoPanel() {
    this.tileInfoPanel = this.add.container(16, 200);
    
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.lineStyle(2, 0xffffff, 0.6);
    background.fillRoundedRect(0, 0, 200, 60, 8);
    background.strokeRoundedRect(0, 0, 200, 60, 8);
    
    const titleText = this.add.text(10, 10, 'Tile Info', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    });
    
    const infoText = this.add.text(10, 30, 'Hover over a tile', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e6e6e6'
    });
    
    this.tileInfoPanel.add([background, titleText, infoText]);
    this.tileInfoPanel.setDepth(1000);
    this.tileInfoPanel.setScrollFactor(0);
  }

  private updateTileInfoPanel() {
    if (!this.tileInfoPanel || !this.hoveredTile) return;
    
    const idx = this.hoveredTile.r * this.map.w + this.hoveredTile.q;
    const tileValue = this.map.move[idx]!;
    
    const infoText = this.tileInfoPanel.getAt(2) as Phaser.GameObjects.Text;
    infoText.setText(`Position: (${this.hoveredTile.q}, ${this.hoveredTile.r})\nMovement: ${tileValue} MP`);
  }

  private hideTileInfoPanel() {
    if (!this.tileInfoPanel) return;
    
    const infoText = this.tileInfoPanel.getAt(2) as Phaser.GameObjects.Text;
    infoText.setText('Hover over a tile');
  }

  private showToast(message: string, duration: number = 3000, onCenter?: () => void) {
    // Limit number of toasts and position them better
    if (this.toasts.length >= 3) {
      // Remove oldest toast
      const oldestToast = this.toasts.shift();
      oldestToast?.dismiss();
    }
    
    const toastOptions: any = {
      message,
      duration,
      position: { x: 16, y: 80 + (this.toasts.length * 70) }, // Reduced spacing
      onDismiss: () => {
        this.toasts = this.toasts.filter(t => t !== toast);
      }
    };
    
    if (onCenter) {
      toastOptions.onCenter = onCenter;
    }
    
    const toast = new Toast(this, toastOptions);
    this.toasts.push(toast);
  }

  private redraw() {
    // clear everything except fog of war
    this.children.getAll().forEach((obj) => {
      if (!this.fogOfWar.isGraphicsObject(obj)) {
        obj.destroy();
      }
    });

    const { w, h, move } = this.map;

    // Draw tiles
          for (let r = 0; r < h; r++) {
        for (let q = 0; q < w; q++) {
          const idx = r * w + q;
          const sel = this.token && q === this.token.position.q && r === this.token.position.r;
          const hover = this.hoveredTile && q === this.hoveredTile.q && r === this.hoveredTile.r;
          drawHex(this, { q, r }, { layout: this.layout, value: move[idx]!, selected: !!sel, hover: !!hover });
        }
      }

    // Draw token
    if (this.token && this.token.isAlive()) {
      this.drawToken();
    }

    // Update fog of war
    this.fogOfWar.updateTokenPosition(this.token.position);

    // info overlay
    const infoText = `Token MP: ${this.token.getMp()} | Click tile to move, click token for info`;
    this.add.text(16, 16, infoText, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6e6e6',
      backgroundColor: 'rgba(0,0,0,0.35)'
    }).setScrollFactor(0).setDepth(1000);
  }

  private drawToken() {
    const { x, y } = axialToPixel(this.token.position, this.layout);
    
    // Draw token as a colored circle
    const tokenGraphics = this.add.graphics();
    tokenGraphics.fillStyle(0xff0000, 0.8);
    tokenGraphics.fillCircle(x, y, 12);
    tokenGraphics.lineStyle(2, 0xffffff, 1);
    tokenGraphics.strokeCircle(x, y, 12);
    
    // Add MP text
    this.add.text(x, y, String(this.token.getMp()), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5).setDepth(100);
  }
}
