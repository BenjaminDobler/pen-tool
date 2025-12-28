# Pent Tool Examples

This directory contains various examples demonstrating different features of the Pent Tool library.

## Running the Examples

```bash
# From the root directory
npm run dev

# Or serve the examples directly
npx vite examples
```

Then open http://localhost:5173/ in your browser.

## Available Examples

### 1. Basic SVG Example (`index.html`)
The foundational example showing the pen tool with SVG rendering.

**Features:**
- Create new paths with the pen tool
- Switch between pen, edit, and view modes
- Drag anchor points and handles
- Close paths

### 2. Canvas Renderer Example (`canvas.html`)
Demonstrates the Canvas 2D renderer as an alternative to SVG.

**Features:**
- Same functionality as SVG example
- Uses Canvas 2D for rendering
- High DPI/Retina display support
- Better performance for complex scenes
- View mode support

### 3. Auto-Import Demo (`auto-import-demo.html`)
**⭐ Simplest example showing automatic import of existing SVG paths**

**Features:**
- Existing `<path>` elements are automatically imported
- Minimal setup - just 2 lines of code
- Paths become immediately editable
- Perfect starting point for new users

**Code:**
```javascript
const pathManager = new PathManager();
const renderer = new SvgPathRenderer(svg, pathManager); // Auto-imports existing paths!
```

### 4. Import SVG Example (`import.html`)
Comprehensive example of importing and editing existing SVG graphics.

**Features:**
- Automatic import of paths on initialization
- Manual import from external SVG elements
- Multiple complex shapes (curves, star, heart)
- Full edit mode with hover preview

### 5. Angular Example (`angular/`)
Modern Angular 21 integration with signals and standalone components.

**Features:**
- Angular signals for reactive state
- Standalone components architecture
- TypeScript integration
- External templates and SCSS styles

**Running:**
```bash
cd examples/angular
npm install
npm start
```

### 6. View Mode Demo (`view-mode-demo.html`)
Side-by-side comparison of edit mode vs view mode.

**Features:**
- Shows the difference between interactive and view-only rendering
- Clean path display without control elements
- Perfect for understanding when to use view mode
- Demonstrates `renderViewOnly()` API

## Key Features Demonstrated

### View Mode (New!)
Display paths without any interactive elements - perfect for final artwork presentation:

```javascript
// Disable both pen tool and edit mode, render paths only
penTool.disable();
editMode.disable();
renderer.renderViewOnly(pathManager);
```

View mode removes:
- Anchor points
- Bezier handles  
- Preview indicators
- Hover effects

Perfect for:
- Displaying final artwork
- Print/export scenarios
- Read-only path visualization
- Performance optimization when interaction isn't needed

### Auto-Import (New!)
When you initialize the renderer with a PathManager, existing `<path>` elements in your SVG are automatically imported:

```javascript
const pathManager = new PathManager();
const renderer = new SvgPathRenderer(svg, pathManager); 
// All existing paths are now editable!
```

To disable auto-import:
```javascript
const renderer = new SvgPathRenderer(svg, pathManager, {
  autoImport: false
});
```

### Manual Import
You can also manually import paths:

```javascript
// Import from path data string
const path = pathManager.importFromSVG('M 0 0 L 100 100', {
  stroke: '#ff0000',
  strokeWidth: 3
});

// Import all paths from an SVG element
const paths = pathManager.importFromSVGElement(svgElement);
```

### Supported SVG Commands
The parser supports these SVG path commands:
- **M/m** - Move to
- **L/l** - Line to
- **H/h** - Horizontal line
- **V/v** - Vertical line
- **C/c** - Cubic Bezier curve
- **S/s** - Smooth cubic Bezier
- **Z/z** - Close path

### Dual Renderer System
Choose between SVG or Canvas rendering:

```javascript
// SVG Renderer (DOM-based)
const renderer = new SvgPathRenderer(svg, pathManager);

// Canvas Renderer (2D context)
const renderer = new CanvasPathRenderer(canvas, pathManager);
```

### Edit Mode Features
- Drag anchor points to move them
- Drag handles to adjust curves
- Hold **Alt** to break handle mirroring
- Double-click on path to add new points
- Hover preview shows where new points will be added

### Pen Tool Features
- Click to add straight points
- Click and drag to add curved points
- Hold **Shift** to snap to 45° angles
- Press **Enter** to close the path
- Press **Escape** to cancel

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- SVG 1.1 support required for SVG renderer
- Canvas 2D API required for Canvas renderer

## Next Steps

1. Start with `auto-import-demo.html` for the simplest example
2. Explore `index.html` or `canvas.html` for full pen tool features
3. Check `import.html` for advanced import scenarios
4. Try the Angular example for framework integration

## Documentation

For full API documentation, see the main README in the root directory.
