import type { Axial } from '../engine/hex.js';

export class Token {
  public position: Axial;
  public mp: number; // Movement Points
  public alive: boolean = true;

  constructor(position: Axial, initialMp: number = 3) {
    this.position = position;
    this.mp = initialMp;
  }

  /**
   * Move token to new position, consuming 1 MP
   * Returns true if movement was successful
   */
  moveTo(newPosition: Axial): boolean {
    if (this.mp <= 0 || !this.alive) return false;
    
    this.position = newPosition;
    this.mp -= 1;
    return true;
  }

  /**
   * Mine a tile and gain MP based on its value
   * Returns true if token survives mining
   */
  mine(tileValue: number): boolean {
    if (!this.alive) return false;
    
    // Add tile value to MP
    this.mp += tileValue;
    
    // Check if token dies (MP <= 0)
    if (this.mp <= 0) {
      this.alive = false;
      return false;
    }
    
    return true;
  }

  /**
   * Get current MP
   */
  getMp(): number {
    return this.mp;
  }

  /**
   * Check if token is alive
   */
  isAlive(): boolean {
    return this.alive;
  }

  /**
   * Kill the token
   */
  kill(): void {
    this.alive = false;
    this.mp = 0;
  }
}
