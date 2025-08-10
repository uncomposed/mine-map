import Phaser from 'phaser';

export function enablePanZoom(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  
  // Set initial zoom and enable smooth camera
  cam.setZoom(1);
  cam.setBackgroundColor('#111318');
  
  // Camera state
  let isPanning = false;
  let lastPointerPosition = { x: 0, y: 0 };
  
  // Smooth zoom variables
  let targetZoom = 1;
  let currentZoom = 1;
  
  // Constants for smooth movement
  const ZOOM_SMOOTHING = 0.15;
  const MAX_ZOOM = 3.0;
  const MIN_ZOOM = 0.3;
  const ZOOM_SPEED = 0.001;
  
  // Left-click drag panning (no right-click)
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pointer.leftButtonDown()) {
      isPanning = true;
      lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  });
  
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (pointer.leftButtonReleased()) {
      isPanning = false;
    }
  });
  
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (isPanning) {
      const deltaX = pointer.x - lastPointerPosition.x;
      const deltaY = pointer.y - lastPointerPosition.y;
      
      // Apply pan with proper world coordinate conversion
      const worldDeltaX = deltaX / cam.zoom;
      const worldDeltaY = deltaY / cam.zoom;
      
      cam.scrollX -= worldDeltaX;
      cam.scrollY -= worldDeltaY;
      
      lastPointerPosition = { x: pointer.x, y: pointer.y };
    }
  });
  
  // Smooth zoom with mouse wheel
  scene.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
    // Calculate zoom factor based on wheel delta
    const zoomFactor = 1 + (deltaY * ZOOM_SPEED);
    targetZoom *= zoomFactor;
    
    // Clamp zoom to reasonable bounds
    targetZoom = Phaser.Math.Clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);
    
    // Get world point under mouse for zoom-to-point
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    
    // Calculate new scroll position to keep zoom point under mouse
    const newZoom = targetZoom;
    
    cam.scrollX = worldPoint.x - (pointer.x / newZoom);
    cam.scrollY = worldPoint.y - (pointer.y / newZoom);
    
    // Set target zoom for smooth interpolation
    targetZoom = newZoom;
  });
  
  // Smooth camera update loop
  scene.events.on('update', () => {
    // Smooth zoom interpolation
    if (Math.abs(currentZoom - targetZoom) > 0.001) {
      currentZoom = Phaser.Math.Linear(currentZoom, targetZoom, ZOOM_SMOOTHING);
      cam.setZoom(currentZoom);
    }
  });
  
  // Add keyboard controls for accessibility
  if (scene.input.keyboard) {
    scene.input.keyboard.on('keydown-W', () => {
      cam.scrollY -= 100 / cam.zoom;
    });
    
    scene.input.keyboard.on('keydown-S', () => {
      cam.scrollY += 100 / cam.zoom;
    });
    
    scene.input.keyboard.on('keydown-A', () => {
      cam.scrollX -= 100 / cam.zoom;
    });
    
    scene.input.keyboard.on('keydown-D', () => {
      cam.scrollX += 100 / cam.zoom;
    });
    
    scene.input.keyboard.on('keydown-Q', () => {
      targetZoom = Phaser.Math.Clamp(targetZoom * 1.1, MIN_ZOOM, MAX_ZOOM);
    });
    
    scene.input.keyboard.on('keydown-E', () => {
      targetZoom = Phaser.Math.Clamp(targetZoom * 0.9, MIN_ZOOM, MAX_ZOOM);
    });
    
    // Reset camera to center
    scene.input.keyboard.on('keydown-R', () => {
      targetZoom = 1;
      cam.centerOn(0, 0);
    });
  }
}
