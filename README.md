# Pen Tool Library

A TypeScript library for creating Figma-style pen tool with Bezier curves and SVG path manipulation.

## Features

- ✅ **Drawing Mode**: Click to add straight points, click-and-drag to create curves
- ✅ **Edit Mode**: Move anchor points, adjust Bezier handles, add/delete points
- ✅ **Smart Point Addition**: Hover preview indicator shows where new points will be added (configurable distance)
- ✅ **Bezier Curves**: Full cubic Bezier support with three handle mirroring modes
  - Mirrored: Both angle and length stay synchronized
  - Angle-locked: Same angle, independent lengths
  - Independent: Complete handle independence
- ✅ **SVG-based**: Clean SVG path generation and rendering
- ✅ **Keyboard Modifiers**: Shift for angle snapping, Alt for independent handles, Enter/Escape for path operations
- ✅ **Interactive UI**: Real-time visual feedback with handles, preview lines, hover indicators, and selection

## Installation

```bash
npm install
```

## Development

```bash
# Start development server
npm run dev

# Build library
npm run build

# Type checking
npm run type-check
```

## Quick Start

```typescript
import { PathManager, PenTool, PathRenderer } from '@pent-tool/core';

// Setup
const svg = document.getElementById('canvas');
const pathManager = new PathManager();
const renderer = new PathRenderer(svg);

// Create pen tool
const penTool = new PenTool(pathManager, {}, {
  onPathModified: (path) => renderer.update(pathManager)
});

// Handle mouse events
svg.addEventListener('mousedown', (e) => {
  const pos = { x: e.offsetX, y: e.offsetY };
  penTool.onMouseDown(pos);
});

svg.addEventListener('mousemove', (e) => {
  const pos = { x: e.offsetX, y: e.offsetY };
  penTool.onMouseMove(pos);
});

svg.addEventListener('mouseup', (e) => {
  const pos = { x: e.offsetX, y: e.offsetY };
  penTool.onMouseUp(pos);
});
```

## Examples

Run the development server and open:
- [examples/basic-drawing.html](examples/basic-drawing.html) - Interactive pen tool demo

## Architecture

### Core Modules

- **types.ts** - TypeScript interfaces and enums
- **path.ts** - Path manipulation, SVG generation, Bezier calculations
- **handles.ts** - Handle mirroring and control point management

### Tools

- **penTool.ts** - Drawing mode with click/drag interactions
- **editMode.ts** - Edit mode for modifying existing paths

### Renderer

- **pathRenderer.ts** - SVG visualization layer

## API Overview

### PathManager

```typescript
const pathManager = new PathManager();
const path = pathManager.createPath();
pathManager.addAnchorPoint(path, { x: 100, y: 100 });
const svgPath = pathManager.toSVGPath(path);
```

### PenTool

```typescript
const penTool = new PenTool(pathManager, options, callbacks);
penTool.onMouseDown(position);
penTool.onMouseMove(position);
penTool.onMouseUp(position);
```

### EditMode

```typescript
const editMode = new EditMode(pathManager, callbacks, options);

// Configure hover distance (default: 5px)
editMode.setHoverDistance(10);

// Mouse interactions
editMode.onMouseDown(position);
editMode.onMouseMove(position); // Shows hover preview near paths
editMode.onDoubleClick(position); // Add point to path

// Callbacks
{
  onPathModified: (path) => { /* path was modified */ },
  onSelectionChange: (points) => { /* selection changed */ },
  onHoverPreview: (point, path) => { 
    // point is null when not hovering near a path
    // Shows preview indicator for adding points
    renderer.renderHoverPreviewPoint(point);
  }
}
```

### PathRenderer

```typescript
const renderer = new PathRenderer(svg, options);
renderer.update(pathManager);
renderer.renderPreviewLine(fromPoint, toPoint);
```

## Keyboard Shortcuts

- **Shift** - Constrain angles to 45° increments
- **Enter** - Close current path
- **Escape** - Finish current path
- **Delete/Backspace** - Remove selected points (edit mode)

## License

MIT
