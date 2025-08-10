import Phaser from 'phaser';
import type { Axial, Layout } from '../engine/hex.js';
import { axialToPixel } from '../engine/hex.js';

export type DrawOpts = { 
  layout: Layout; 
  value: number; 
  radius?: number; 
  selected?: boolean; 
  hover?: boolean; 
  revealed?: boolean;
};

// Pre-calculate hex points for better performance (flat-top)
const HEX_POINTS: Phaser.Types.Math.Vector2Like[] = [];
for (let i = 0; i < 6; i++) {
  const angle = (Math.PI / 180) * (60 * i);
  HEX_POINTS.push({ x: Math.cos(angle), y: Math.sin(angle) });
}

export function drawHex(scene: Phaser.Scene, a: Axial, opts: DrawOpts) {
  const { layout, value, selected, hover, revealed } = opts;
  const r = opts.radius ?? layout.hexSize;

  // Create a container for the hex
  const container = scene.add.container(0, 0);
  
  const g = scene.add.graphics();
  
  // Base tile color based on value
  let baseColor: number;
  let alpha: number;
  
  if (value <= 0) {
    baseColor = 0x1e3a8a; // Deep blue for water/negative
    alpha = 0.9;
  } else if (value === 1) {
    baseColor = 0x374151; // Dark gray for neutral
    alpha = 0.85;
  } else {
    baseColor = 0x059669; // Green for positive
    alpha = 0.8;
  }

  // Fill the hex
  g.fillStyle(baseColor, alpha);
  g.beginPath();
  g.moveTo(HEX_POINTS[0]!.x * r, HEX_POINTS[0]!.y * r);
  for (let i = 1; i < 6; i++) {
    g.lineTo(HEX_POINTS[i]!.x * r, HEX_POINTS[i]!.y * r);
  }
  g.closePath();
  g.fillPath();

  // Add texture patterns for accessibility
  if (revealed) {
    g.lineStyle(1, 0xffffff, 0.3);
    
    if (value < 0) {
      // Cross-hatch pattern for negative values
      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * (r / 3);
        g.moveTo(-r + offset, -r);
        g.lineTo(r + offset, r);
        g.moveTo(r + offset, -r);
        g.lineTo(-r + offset, r);
      }
    } else if (value === 1) {
      // Dots pattern for neutral
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const dotX = (i - 1) * (r / 2);
          const dotY = (j - 1) * (r / 2);
          g.fillCircle(dotX, dotY, 2);
        }
      }
    } else {
      // Chevron pattern for positive values
      g.lineStyle(2, 0xffffff, 0.6);
      g.beginPath();
      g.moveTo(-r/2, -r/3);
      g.lineTo(0, r/3);
      g.lineTo(r/2, -r/3);
      g.strokePath();
    }
  }

  // Border based on state
  if (selected) {
    g.lineStyle(3, 0xffff00, 1); // Yellow for selection
  } else if (hover) {
    g.lineStyle(2, 0x00ff00, 0.9); // Green for hover
  } else {
    g.lineStyle(1.5, 0x666666, 0.7); // Gray for normal
  }
  g.strokePath();

  // Add value label - LARGE and CLEAR
  if (revealed) {
    const label = scene.add.text(0, 0, String(value), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(100);
    
    // Name the label for easy reference
    const key = `${a.q},${a.r}`;
    label.setName(`label_${key}`);

    container.add(label);
  }

  // Add graphics to container
  container.add(g);

  return container;
}
