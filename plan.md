## Plan: Figma-Style Pen Tool Library (Complete Feature Set)

A comprehensive TypeScript library implementing Figma's pen tool with cubic Bezier curves, straight lines, vector path editing, handle manipulation, and interactive drawing modes. Built on SVG with extensibility for quadratic Bezier curves.

### Steps

1. **Initialize project with TypeScript foundation** — Set up `package.json`, `tsconfig.json`, build tooling (Rollup/Vite), and folder structure: `src/core/`, `src/tools/`, `src/renderer/`, `examples/`

2. **Build core data models and types** — Create `src/core/types.ts` defining `Point`, `AnchorPoint` (with handle mirroring modes: mirrored, angle-locked, independent), `BezierHandle`, `PathSegment` (straight/curved), `VectorPath`, and curve type enums

3. **Implement path manipulation engine** — Create `src/core/path.ts` with methods to add/remove/move anchor points, insert points on existing segments, convert straight↔curved segments, close/open paths, calculate Bezier curves, and generate SVG path data

4. **Build handle control system** — Create `src/core/handles.ts` implementing three mirroring modes (mirrored, angle-locked, independent), handle manipulation logic, and automatic handle generation when converting segments

5. **Implement pen tool interaction controller** — Create `src/tools/penTool.ts` handling click (straight segments), click-drag (curved with handles), hover detection for closing paths, keyboard modifiers (Shift for 45° constraints, Alt for independent handles), and state machine for drawing vs. editing modes

6. **Create vector edit mode** — Build `src/tools/editMode.ts` for selecting/moving anchor points, dragging handles, multi-select with Shift, adding points to existing paths, deleting points, and switching between move/pen/bend tools

7. **Add bend tool for segment conversion** — Implement `src/tools/bendTool.ts` to click on straight points/segments and add Bezier handles, converting them to curves

8. **Build SVG rendering layer** — Create `src/renderer/pathRenderer.ts` visualizing paths (selected/unselected states), anchor points (straight/curved types), Bezier handles with endpoints, preview lines while drawing, and cursor indicators (close-path circle, add-point plus)

9. **Implement snapping system** — Create `src/core/snapping.ts` with pixel grid snapping, point-to-point snapping, and temporary disable with modifier key

10. **Add advanced features** — Build `src/core/cornerRadius.ts` for per-point corner radius, `src/tools/cutTool.ts` for splitting paths, and endpoint cap styles in `src/core/strokeCaps.ts`

11. **Create comprehensive examples** — Build `examples/basic-drawing.html` (simple path creation), `examples/path-editing.html` (edit mode demo), and `examples/advanced-features.html` (all features)

### Further Considerations

1. **Vector networks vs. traditional paths** — Figma uses non-directional vector networks with branching. Should we implement traditional single-direction paths first (simpler), or Figma's unique multi-endpoint vector network system (more complex but more powerful)?

2. **Feature prioritization** — Core features (click, drag, handles, edit mode) vs. advanced features (variable width strokes, lasso selection, cut tool, region fills). Should we build in phases: Phase 1 (core drawing), Phase 2 (editing), Phase 3 (advanced tools)?

3. **Framework agnostic vs. framework-specific** — Should the library be pure TypeScript with framework adapters (`src/adapters/react.tsx`, `src/adapters/vue.ts`), or build for vanilla JS with examples showing framework integration?

4. **Rendering strategy** — Direct SVG DOM manipulation vs. virtual SVG rendering (like React SVG components) vs. Canvas fallback for performance? SVG is more accessible but Canvas may perform better with complex paths.