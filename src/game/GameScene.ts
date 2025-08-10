import Phaser from 'phaser';
import { generateMovement } from './MapGen.js';
import type { Axial, Layout } from '../engine/hex.js';
import { pixelToAxial, axialToPixel, axialDistance } from '../engine/hex.js';
import { enablePanZoom } from './InputCamera.js';
import { Token } from './Token.js';
import { Toast, type ToastOptions } from './Toast.js';
import { FogOfWar } from './FogOfWar.js';
import { drawHex } from './HexTile.js';

export class GameScene extends Phaser.Scene {
  private layout!: Layout;
  private map = generateMovement({ width: 30, height: 30, seed: 'alpha-001' });
  private token!: Token;
  private fogOfWar!: FogOfWar;
  private toasts: Toast[] = [];
  
  // Containers for organization
  private hexContainer!: Phaser.GameObjects.Container;
  private tokenContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  
  // Game state
  private score: number = 0;
  private tilesMined: number = 0;
  private lastTokenPosition: Axial | null = null;

  constructor() { super('GameScene'); }

  create() {
    this.layout = { hexSize: 20, originX: 100, originY: 100 };
    enablePanZoom(this);

    // Create containers
    this.hexContainer = this.add.container(0, 0);
    this.tokenContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    // Initialize token at center of map
    const centerQ = Math.floor(this.map.w / 2);
    const centerR = Math.floor(this.map.h / 2);
    this.token = new Token({ q: centerQ, r: centerR }, 5);
    this.lastTokenPosition = { ...this.token.position };

    // Initialize fog of war
    this.fogOfWar = new FogOfWar(this, this.map.w, this.map.h, 3);
    this.fogOfWar.updateTokenPosition(this.token.position);

    // Draw initial map
    this.drawMap();

    // Draw token
    this.drawToken();

    // Add UI overlay
    this.addUIOverlay();

    // Set initial camera position to center of map
    const centerPixel = axialToPixel({ q: centerQ, r: centerR }, this.layout);
    this.cameras.main.centerOn(centerPixel.x, centerPixel.y);

    // Handle tile clicks for movement and mining
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const world = this.cameras.main.getWorldPoint(p.x, p.y);
      const a = pixelToAxial(world.x, world.y, this.layout);
      
      if (a.q < 0 || a.r < 0 || a.q >= this.map.w || a.r >= this.map.h) return;
      
      // Check if clicking on token position
      if (a.q === this.token.position.q && a.r === this.token.position.r) {
        this.showTokenInfo();
        return;
      }
      
      // Check if clicking on adjacent tile for mining
      const distance = axialDistance(a, this.token.position);
      if (distance === 1) {
        this.tryMineTile(a);
      } else if (distance <= 2) {
        // Try to move token
        this.tryMoveToken(a);
      }
    });

    // Handle hover effects
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const world = this.cameras.main.getWorldPoint(p.x, p.y);
      const a = pixelToAxial(world.x, world.y, this.layout);
      this.updateHoverState(a);
    });

    // Redraw map when camera moves for viewport culling
    this.cameras.main.on('cameramove', () => {
      this.drawMap();
      this.drawToken();
    });
  }

  private drawMap() {
    // Clear existing hexes
    this.hexContainer.removeAll();
    
    // Get camera bounds for culling
    const cam = this.cameras.main;
    const worldBounds = {
      left: cam.scrollX - 100,
      right: cam.scrollX + cam.width / cam.zoom + 100,
      top: cam.scrollY - 100,
      bottom: cam.scrollY + cam.height / cam.zoom + 100
    };
    
    // Draw only hexes within camera bounds for better performance
    for (let r = 0; r < this.map.h; r++) {
      for (let q = 0; q < this.map.w; q++) {
        const pixel = axialToPixel({ q, r }, this.layout);
        
        // Simple bounds checking
        if (pixel.x >= worldBounds.left && pixel.x <= worldBounds.right &&
            pixel.y >= worldBounds.top && pixel.y <= worldBounds.bottom) {
          this.drawHexTile(q, r);
        }
      }
    }
  }

  private drawHexTile(q: number, r: number) {
    const key = `${q},${r}`;
    const idx = r * this.map.w + q;
    const tileValue = this.map.move[idx]!;
    
    // Check if tile is revealed by fog of war
    const revealed = this.fogOfWar.isTileRevealed(q, r);
    
    // Check if this is the token's position
    const selected = q === this.token.position.q && r === this.token.position.r;
    
    // Create hex container
    const hexContainer = drawHex(this, { q, r }, { 
      layout: this.layout, 
      value: tileValue, 
      selected: selected, 
      hover: false,
      revealed: revealed
    });
    
    // Position the hex container at the correct world coordinates
    const { x, y } = axialToPixel({ q, r }, this.layout);
    hexContainer.setPosition(x, y);
    
    // Add to hex container
    this.hexContainer.add(hexContainer);
    hexContainer.setName(key);
  }

  private updateHoverState(hoverPosition: Axial) {
    // Only update the specific tiles that need to change
    // Clear previous hover state
    for (let r = 0; r < this.map.h; r++) {
      for (let q = 0; q < this.map.w; q++) {
        const key = `${q},${r}`;
        const container = this.hexContainer.getByName(key) as Phaser.GameObjects.Container;
        if (container) {
          // Remove hover border if it exists
          const graphics = container.getByName('hoverBorder') as Phaser.GameObjects.Graphics;
          if (graphics) {
            graphics.destroy();
          }
        }
      }
    }
    
    // Add hover state only to the hovered tile
    if (hoverPosition.q >= 0 && hoverPosition.r >= 0 && 
        hoverPosition.q < this.map.w && hoverPosition.r < this.map.h) {
      const key = `${hoverPosition.q},${hoverPosition.r}`;
      const container = this.hexContainer.getByName(key) as Phaser.GameObjects.Container;
      if (container) {
        // Add hover border
        const hoverGraphics = this.add.graphics();
        hoverGraphics.lineStyle(3, 0x00ff00, 0.9);
        hoverGraphics.strokeCircle(0, 0, 20);
        hoverGraphics.setName('hoverBorder');
        container.add(hoverGraphics);
      }
    }
  }

  private tryMoveToken(targetPosition: Axial) {
    if (!this.token.isAlive()) return;

    // Check if target is within movement range (2 tiles for now)
    const distance = axialDistance(targetPosition, this.token.position);
    if (distance > 2) {
      this.showToast('Cannot move that far!', 2000);
      return;
    }

    // Check if target is accessible
    const targetIdx = targetPosition.r * this.map.w + targetPosition.q;
    const moveCost = this.map.move[targetIdx]!;
    
    if (moveCost <= 0) {
      this.showToast('Cannot move to water!', 2000);
      return;
    }

    // Store last position for death toast
    this.lastTokenPosition = { ...this.token.position };

    // Move token (costs 1 MP)
    const success = this.token.moveTo(targetPosition);
    if (!success) {
      this.showToast('Not enough MP to move!', 2000);
      return;
    }

    // Update display
    this.updateTokenPosition();
    this.updateMapAfterMovement();
    
    // Show movement feedback
    this.showToast(`Moved to (${targetPosition.q}, ${targetPosition.r})`, 1500);
    
    // Update score
    this.score += 1;
    this.updateScoreDisplay();
  }

  private tryMineTile(targetPosition: Axial) {
    if (!this.token.isAlive()) return;

    // Check if target is adjacent
    const distance = axialDistance(targetPosition, this.token.position);
    if (distance !== 1) {
      this.showToast('Can only mine adjacent tiles!', 2000);
      return;
    }

    // Check if target is accessible
    const targetIdx = targetPosition.r * this.map.w + targetPosition.q;
    const tileValue = this.map.move[targetIdx]!;
    
    if (tileValue <= 0) {
      this.showToast('Cannot mine water!', 2000);
      return;
    }

    // Mine the tile
    const success = this.token.mine(tileValue);
    
    if (success) {
      // Update score
      this.score += tileValue;
      this.tilesMined += 1;
      this.updateScoreDisplay();
      
      // Update token display
      this.updateTokenPosition();
      
      this.showToast(`Mined tile! Gained ${tileValue} MP. Total MP: ${this.token.getMp()}`, 2000);
    } else {
      // Token died from mining
      this.showToast('Token died from mining!', 3000);
      this.showDeathToast();
    }
  }

  private updateMapAfterMovement() {
    // Update fog of war
    this.fogOfWar.updateTokenPosition(this.token.position);
    
    // Redraw map with new visibility
    this.drawMap();
    
    // Redraw token on top
    this.drawToken();
  }

  private updateTokenPosition() {
    // Clear old token
    this.tokenContainer.removeAll();
    
    // Draw new token
    this.drawToken();
  }

  private drawToken() {
    const { x, y } = axialToPixel(this.token.position, this.layout);
    
    // Clear previous token
    this.tokenContainer.removeAll();
    
    // Draw token as a colored circle at world coordinates
    const tokenGraphics = this.add.graphics();
    tokenGraphics.fillStyle(0xff0000, 0.9);
    tokenGraphics.fillCircle(0, 0, 18);
    tokenGraphics.lineStyle(3, 0xffffff, 1);
    tokenGraphics.strokeCircle(0, 0, 18);
    
    // Add inner highlight
    tokenGraphics.lineStyle(2, 0xff6666, 0.8);
    tokenGraphics.strokeCircle(0, 0, 12);
    
    // Add MP text
    const mpText = this.add.text(0, 0, String(this.token.getMp()), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    mpText.setOrigin(0.5, 0.5).setDepth(1000);
    
    // Add to token container and set depth
    this.tokenContainer.add([tokenGraphics, mpText]);
    this.tokenContainer.setDepth(500);
    
    // Position the token container at the correct world coordinates
    this.tokenContainer.setPosition(x, y);
  }

  private showTokenInfo() {
    this.showToast(`Token at (${this.token.position.q}, ${this.token.position.r}) | MP: ${this.token.getMp()}`, 3000);
  }

  private showDeathToast() {
    if (this.lastTokenPosition) {
      this.showToast('Token died! Click to recenter on last position.', 5000, () => {
        // Recenter camera on last token position
        const lastPixel = axialToPixel(this.lastTokenPosition!, this.layout);
        this.cameras.main.centerOn(lastPixel.x, lastPixel.y);
      });
    }
  }

  private addUIOverlay() {
    const infoText = `MP: ${this.token.getMp()} | Drag to pan, scroll to zoom | Click adjacent to mine, click distant to move | WASD/QE/R for camera`;
    const info = this.add.text(16, 16, infoText, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6e6e6',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    });
    info.setScrollFactor(0).setDepth(1000);
    this.uiContainer.add(info);
    
    // Add score display
    this.updateScoreDisplay();
  }

  private updateScoreDisplay() {
    // Remove old score display if it exists
    const oldScore = this.uiContainer.getByName('scoreDisplay');
    if (oldScore) {
      oldScore.destroy();
    }
    
    const scoreText = this.add.text(16, 50, `Score: ${this.score} | Tiles Mined: ${this.tilesMined}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    });
    scoreText.setScrollFactor(0).setDepth(1000);
    scoreText.setName('scoreDisplay');
    this.uiContainer.add(scoreText);
  }

  private showToast(message: string, duration: number = 3000, onCenter?: () => void) {
    // Limit number of toasts
    if (this.toasts.length >= 3) {
      const oldestToast = this.toasts.shift();
      oldestToast?.dismiss();
    }
    
    const toastOptions: ToastOptions = {
      message,
      duration,
      position: { x: 16, y: 80 + (this.toasts.length * 70) },
      onDismiss: () => {
        this.toasts = this.toasts.filter(t => t !== toast);
      }
    };
    
    // Only add onCenter if it's defined
    if (onCenter) {
      toastOptions.onCenter = onCenter;
    }
    
    const toast = new Toast(this, toastOptions);
    this.toasts.push(toast);
    return toast;
  }
}
