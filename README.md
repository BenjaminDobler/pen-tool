# Pen Tool Library

A TypeScript library providing a Figma-style pen tool for creating and editing SVG paths with Bezier curves.

## Features

- ✅ **Drawing Mode**: Click to add straight points, click-and-drag to create curves
- ✅ **Edit Mode**: Move anchor points, adjust Bezier handles, add/delete points
- ✅ **Smart Point Addition**: Hover preview indicator shows where new points will be added (configurable distance)
- ✅ **Perfect Curve Subdivision**: Adding points preserves exact curve shape using De Casteljau's algorithm
- ✅ **Bezier Curves**: Full cubic Bezier support with three handle mirroring modes
  - Mirrored: Both angle and length stay synchronized
  - Angle-locked: Same angle, independent lengths
  - Independent: Complete handle independence
- ✅ **Dual Renderers**: Choose between SVG or Canvas 2D rendering
  - **SVG Renderer**: DOM-based, resolution-independent, easier debugging
  - **Canvas Renderer**: Faster performance, lightweight, better for animations
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

### SVG Renderer

```typescript
import { PathManager, PenTool, SvgPathRenderer } from '@pent-tool/core';

// Setup
const svg = document.getElementById('canvas');
const pathManager = new PathManager();
const renderer = new SvgPathRenderer(svg);

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

### Canvas Renderer

```typescript
import { PathManager, PenTool, CanvasPathRenderer } from '@pent-tool/core';

// Setup
const canvas = document.getElementById('canvas');
const pathManager = new PathManager();
const renderer = new CanvasPathRenderer(canvas);

// Create pen tool (same as SVG)
const penTool = new PenTool(pathManager, {}, {
  onPathModified: (path) => renderer.update(pathManager)
});

// Handle mouse events (same as SVG)
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  penTool.onMouseDown(pos);
});
// ... etc
```

## Examples

Run the development server and open:
- [examples/index.html](examples/index.html) - SVG Renderer demo
- [examples/canvas.html](examples/canvas.html) - Canvas Renderer demo
- [examples/angular/](examples/angular/) - Angular 21 example with signals

## Choosing a Renderer

### Use SVG Renderer when:
- You need resolution-independent graphics
- DOM inspection/debugging is important
- Working with simpler paths (< 100 elements)
- Need easy hit testing and interactivity
- Exporting to SVG format

### Use Canvas Renderer when:
- Performance is critical (many paths/points)
- Creating animations or real-time effects
- Need lightweight rendering
- Working in a game or animation context
- Don't need DOM access to path elements

Both renderers implement the same `IPathRenderer` interface, so switching is seamless!

## Architecture

### Core Modules

- **types.ts** - TypeScript interfaces and enums
- **path.ts** - Path manipulation, SVG generation, Bezier calculations (including De Casteljau subdivision)
- **handles.ts** - Handle mirroring and control point management

### Tools

- **penTool.ts** - Drawing mode with click/drag interactions
- **editMode.ts** - Edit mode for modifying existing paths with hover preview

### Renderers

- **IPathRenderer.ts** - Renderer interface for pluggable rendering backends
- **pathRenderer.ts** - SVG renderer implementation (SvgPathRenderer)
- **canvasPathRenderer.ts** - Canvas 2D renderer implementation (CanvasPathRenderer)

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

### Renderers

```typescript
// SVG Renderer
const svgRenderer = new SvgPathRenderer(svgElement, options);
svgRenderer.update(pathManager);
svgRenderer.renderPreviewLine(fromPoint, toPoint);

// Canvas Renderer
const canvasRenderer = new CanvasPathRenderer(canvasElement, options);
canvasRenderer.update(pathManager);
canvasRenderer.renderPreviewLine(fromPoint, toPoint);

// Both implement IPathRenderer interface
// Backward compatibility: PathRenderer is an alias for SvgPathRenderer
const renderer = new PathRenderer(svgElement, options);
```

## Keyboard Shortcuts

- **Shift** - Constrain angles to 45° increments
- **Enter** - Close current path
- **Escape** - Finish current path
- **Delete/Backspace** - Remove selected points (edit mode)

## License

MIT
