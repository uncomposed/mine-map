# Mine Map

A hexagonal grid mining game built with Phaser 3 and TypeScript with smooth, professional-grade camera controls and engaging gameplay mechanics.

## Controls

### Camera Controls
- **Right Click + Drag**: Smooth panning with momentum
- **Mouse Wheel**: Smooth zoom-to-point
- **WASD Keys**: Keyboard camera movement
- **Q/E Keys**: Keyboard zoom in/out
- **R Key**: Reset camera to center

### Game Controls
- **Left Click**: Select tiles or move token
- **Hover**: View tile information
- **SPACE**: Restart game after death

## Game Features

- **Hexagonal Grid**: Beautiful 60x60 hex grid with procedurally generated terrain
- **Mining System**: Mine tiles to gain Movement Points (MP)
- **Resource Management**: Balance MP consumption with mining rewards
- **Fog of War**: Explore the map with limited visibility
- **Score System**: Track your progress and tiles mined
- **Game Over & Restart**: Continue playing after death with SPACE key

## Performance Features

- **Smooth Camera Movement**: Professional-grade panning with momentum and easing
- **Smooth Zooming**: Zoom-to-point with smooth interpolation
- **Efficient Rendering**: Hexes are drawn once and only updated when necessary
- **Smart Updates**: Only token position and affected tiles are redrawn
- **Container Organization**: Graphics objects are organized in containers for better performance
- **Input Optimization**: Throttled hover updates and right-click panning prevent conflicts
- **Anti-aliasing**: Smooth hex rendering with proper line smoothing

## Game Mechanics

- Move your token to mine tiles
- Each tile has a movement cost (MP)
- Manage your MP carefully to avoid death
- Explore the map while staying alive
- Build your score by mining valuable tiles
- Restart and try to beat your previous score

## Technical Implementation

- **Smooth Panning**: Uses velocity-based movement with momentum and decay
- **Smooth Zooming**: Implements zoom-to-point with smooth interpolation
- **Performance Optimization**: 60 FPS hover updates with throttling
- **Graphics Optimization**: Efficient hex rendering with anti-aliasing
- **Input Handling**: Prevents conflicts between game and camera controls
- **State Management**: Clean game state with score tracking and restart functionality
- **Procedural Generation**: Fractal noise-based terrain generation for varied maps

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Code Quality

- **TypeScript**: Full type safety and modern JavaScript features
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Consistent code formatting
- **Vitest**: Fast unit testing framework