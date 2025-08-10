import Phaser from 'phaser';
import type { Axial, Layout } from '../engine/hex.js';
import { axialDistance, axialToPixel } from '../engine/hex.js';

export class FogOfWar {
  private scene: Phaser.Scene;
  private fogGraphics: Phaser.GameObjects.Graphics;
  private visionRadius: number;
  private mapWidth: number;
  private mapHeight: number;
  private revealedTiles: Set<string> = new Set();
  private tokenPosition?: Axial;
  private layout: Layout;

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, visionRadius: number = 3) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.visionRadius = visionRadius;
    this.layout = { hexSize: 20, originX: 100, originY: 100 }; // Match main scene layout
    
    this.fogGraphics = this.scene.add.graphics();
    this.fogGraphics.setDepth(500); // Above tiles, below UI
  }

  /**
   * Check if an object is the fog graphics object
   */
  public isGraphicsObject(obj: Phaser.GameObjects.GameObject): boolean {
    return obj === this.fogGraphics;
  }

  /**
   * Update token position and recalculate visibility
   */
  public updateTokenPosition(position: Axial) {
    this.tokenPosition = position;
    this.updateVisibility();
  }

  /**
   * Check if a tile is visible
   */
  public isTileVisible(q: number, r: number): boolean {
    if (!this.tokenPosition) return false;
    
    const distance = axialDistance({ q, r }, this.tokenPosition);
    return distance <= this.visionRadius;
  }

  /**
   * Check if a tile is revealed (was ever visible)
   */
  public isTileRevealed(q: number, r: number): boolean {
    const key = `${q},${r}`;
    return this.revealedTiles.has(key);
  }

  /**
   * Update visibility based on current token position
   */
  private updateVisibility() {
    if (!this.tokenPosition) return;

    // Clear previous fog
    this.fogGraphics.clear();
    
    // Only draw fog for tiles that need it
    for (let r = 0; r < this.mapHeight; r++) {
      for (let q = 0; q < this.mapWidth; q++) {
        const isVisible = this.isTileVisible(q, r);
        
        if (isVisible) {
          // Mark tile as revealed
          const key = `${q},${r}`;
          this.revealedTiles.add(key);
        } else if (this.isTileRevealed(q, r)) {
          // Previously revealed tile - show with partial fog
          this.drawFogHex({ q, r }, 0.4);
        } else {
          // Never revealed - full fog
          this.drawFogHex({ q, r }, 0.9);
        }
      }
    }
  }

  /**
   * Draw a single fog hex
   */
  private drawFogHex(axial: Axial, alpha: number) {
    const { x, y } = axialToPixel(axial, this.layout);
    const r = this.layout.hexSize;
    
    this.fogGraphics.fillStyle(0x000000, alpha);
    
    // Draw hexagon shape (flat-top)
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      pts.push({ x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) });
    }
    
    this.fogGraphics.beginPath();
    this.fogGraphics.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < 6; i++) {
      this.fogGraphics.lineTo(pts[i]!.x, pts[i]!.y);
    }
    this.fogGraphics.closePath();
    this.fogGraphics.fillPath();
  }

  /**
   * Clear all fog (for debugging or full map reveal)
   */
  public clearAllFog() {
    this.revealedTiles.clear();
    this.fogGraphics.clear();
  }

  /**
   * Set vision radius
   */
  public setVisionRadius(radius: number) {
    this.visionRadius = radius;
    if (this.tokenPosition) {
      this.updateVisibility();
    }
  }

  /**
   * Get current vision radius
   */
  public getVisionRadius(): number {
    return this.visionRadius;
  }

  /**
   * Destroy fog graphics
   */
  public destroy() {
    this.fogGraphics.destroy();
  }
}
