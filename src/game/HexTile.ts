import Phaser from 'phaser';
import type { Axial, Layout } from '../engine/hex.js';
import { axialToPixel } from '../engine/hex.js';

export type DrawOpts = { layout: Layout; value: number; radius?: number; selected?: boolean; hover?: boolean; };

export function drawHex(scene: Phaser.Scene, a: Axial, opts: DrawOpts) {
  const { layout, value, selected, hover } = opts;
  const { x, y } = axialToPixel(a, layout);
  const r = opts.radius ?? layout.hexSize;

  const g = scene.add.graphics({ x, y });
  
  // Determine line style based on state
  if (selected) {
    g.lineStyle(2, 0xffffff, 1);
  } else if (hover) {
    g.lineStyle(2, 0x00ff00, 0.8);
  } else {
    g.lineStyle(1, 0xffffff, 0.6);
  }

  const fill = value <= 0 ? 0x153a6f : value === 1 ? 0x303540 : 0x3c6e36;
  const alpha = 0.9;

  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  g.fillStyle(fill, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 6; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
  g.strokePath();

  g.lineStyle(1, 0xffffff, 0.15);
  if (value <= 0) {
    for (let t = -r; t <= r; t += r / 3) {
      g.lineBetween(-r, t, r, t);
      g.lineBetween(t, -r, t, r);
    }
  } else if (value === 1) {
    for (let yy = -r * 0.7; yy <= r * 0.7; yy += r / 3) {
      for (let xx = -r * 0.7; xx <= r * 0.7; xx += r / 3) {
        g.fillStyle(0xffffff, 0.15);
        g.fillCircle(xx, yy, 1.5);
      }
    }
  } else if (value > 1) {
    for (let yy = -r * 0.8; yy <= r * 0.8; yy += r / 3) {
      g.beginPath();
      g.moveTo(-r * 0.5, yy + r / 6);
      g.lineTo(0, yy - r / 6);
      g.lineTo(r * 0.5, yy + r / 6);
      g.strokePath();
    }
  }

  const label = scene.add.text(x, y, String(value), {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#e6e6e6'
  }).setOrigin(0.5, 0.55);
  label.setDepth(100);

  return g;
}
