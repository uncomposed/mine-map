import Phaser from 'phaser';

export function enablePanZoom(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  cam.setZoom(1);

  let dragging = false;
  let lastX = 0, lastY = 0;

  scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
    dragging = true;
    lastX = p.x;
    lastY = p.y;
  });
  scene.input.on('pointerup', () => { dragging = false; });
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!dragging) return;
    const dx = p.x - lastX;
    const dy = p.y - lastY;
    const camMain = scene.cameras.main;
    camMain.scrollX -= dx / camMain.zoom;
    camMain.scrollY -= dy / camMain.zoom;
    lastX = p.x;
    lastY = p.y;
  });

  scene.input.on('wheel', (_: any, __: any, ___: any, dy: number) => {
    const camMain = scene.cameras.main;
    const z = camMain.zoom * (dy > 0 ? 0.9 : 1.1);
    camMain.setZoom(Phaser.Math.Clamp(z, 0.4, 2.5));
  });
}
