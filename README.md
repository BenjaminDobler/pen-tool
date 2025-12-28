# Pen Tool Library

A TypeScript library for creating Figma-style pen tool with Bezier curves and SVG path manipulation.

## Features

- ✅ **Drawing Mode**: Click to add straight points, click-and-drag to create curves
- ✅ **Edit Mode**: Move anchor points, adjust Bezier handles, add/delete points
- ✅ **Bezier Curves**: Full cubic Bezier support with three handle mirroring modes
  - Mirrored: Both angle and length stay synchronized
  - Angle-locked: Same angle, independent lengths
  - Independent: Complete handle independence
- ✅ **SVG-based**: Clean SVG path generation and rendering
- ✅ **Keyboard Modifiers**: Shift for angle snapping, Enter/Escape for path operations
- ✅ **Interactive UI**: Real-time visual feedback with handles, preview lines, and selection

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
const editMode = new EditMode(pathManager, callbacks);
editMode.onMouseDown(position);
editMode.onDoubleClick(position); // Add point to path
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
