# Angular Pen Tool Example

Modern Angular implementation of the pen tool library using Angular 17+ features.

## Features

- ✅ **Standalone Components** - No NgModule required
- ✅ **Signals** - Modern reactive state management
- ✅ **Modern Control Flow** - Using `@if`, `@for` syntax
- ✅ **ViewChild Signals** - New `viewChild()` API
- ✅ **Fully Typed** - Complete TypeScript integration

## Setup

```bash
cd examples/angular
npm install
npm start
```

Open http://localhost:4200

## Key Angular Features Used

### Signals for State Management
```typescript
mode = signal<ToolMode>('pen');
toolState = signal<string>('IDLE');
pathCount = signal<number>(0);
currentPath = signal<VectorPath | null>(null);
```

### Modern Control Flow Syntax
```html
@if (currentPath()) {
  Current points: <strong>{{ currentPath()!.anchorPoints.length }}</strong>
}

@if (selectedPoints().length > 0) {
  Selected points: <strong>{{ selectedPoints().length }}</strong>
}
```

### ViewChild with Signals
```typescript
canvas = viewChild.required<ElementRef<SVGSVGElement>>('canvas');
```

## Architecture

The component wraps the pen tool library and provides:
- Reactive state management with signals
- Event handling for mouse and keyboard
- Real-time UI updates
- Mode switching (draw/edit)

All business logic remains in the core library, while Angular handles the UI reactivity.
