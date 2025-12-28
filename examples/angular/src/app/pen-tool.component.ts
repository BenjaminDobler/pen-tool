import { Component, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  PathManager, 
  PenTool, 
  EditMode, 
  PathRenderer,
  PenToolState,
  VectorPath,
  AnchorPoint,
  Point
} from '../../../../src/index';

type ToolMode = 'pen' | 'edit';

@Component({
  selector: 'app-pen-tool',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="sidebar">
        <h1>🖊️ Pen Tool (Angular)</h1>

        <div class="section">
          <div class="section-title">Status</div>
          <div class="info">
            Mode: <span class="state-indicator">{{ mode().toUpperCase() }}</span>
            <br>
            State: <span class="state-indicator">{{ toolState() }}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Actions</div>
          <button 
            class="button" 
            (click)="toggleMode()">
            {{ mode() === 'pen' ? 'Switch to Edit Mode' : 'Switch to Draw Mode' }}
          </button>
          <button 
            class="button secondary" 
            (click)="clearAllPaths()">
            Clear All Paths
          </button>
          <button 
            class="button secondary" 
            (click)="closeCurrentPath()"
            [disabled]="!canClosePath()">
            Close Current Path
          </button>
        </div>

        <div class="section">
          <div class="section-title">Path Statistics</div>
          <div class="info">
            Paths: <strong>{{ pathCount() }}</strong><br>
            <ng-container *ngIf="currentPath()">
              Current points: <strong>{{ currentPath()!.anchorPoints.length }}</strong><br>
              Path closed: <strong>{{ currentPath()!.closed ? 'Yes' : 'No' }}</strong>
            </ng-container>
            <ng-container *ngIf="selectedPoints().length > 0">
              <br>Selected points: <strong>{{ selectedPoints().length }}</strong>
            </ng-container>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Instructions</div>
          <div class="info">
            <strong>Drawing Mode:</strong><br>
            • Click to add straight points<br>
            • Click & drag to create curves<br>
            • Hold <span class="key">Shift</span> to constrain angles<br>
            • Hold <span class="key">Alt</span> for independent handles<br>
            • Click on first point to close path<br>
            <br>
            <strong>Edit Mode:</strong><br>
            • Click & drag anchor points to move<br>
            • Click & drag handles to adjust curves<br>
            • Hold <span class="key">Alt</span> while dragging handles for independent control<br>
            • Double-click on path to add points<br>
            • Select points and press <span class="key">Delete</span> to remove
          </div>
        </div>

        <div class="section">
          <div class="section-title">Keyboard Shortcuts</div>
          <div class="keyboard-shortcuts">
            <div class="shortcut">
              <span>Constrain angle</span>
              <span class="key">Shift</span>
            </div>
            <div class="shortcut">
              <span>Independent handles</span>
              <span class="key">Alt</span>
            </div>
            <div class="shortcut">
              <span>Close path</span>
              <span class="key">Enter</span>
            </div>
            <div class="shortcut">
              <span>Finish path</span>
              <span class="key">Esc</span>
            </div>
            <div class="shortcut">
              <span>Delete point</span>
              <span class="key">Delete</span>
            </div>
          </div>
        </div>
      </div>

      <div class="canvas-container">
        <svg 
          #canvas
          width="800" 
          height="600"
          [style.cursor]="mode() === 'pen' ? 'crosshair' : 'default'"
          (mousedown)="onMouseDown($event)"
          (mousemove)="onMouseMove($event)"
          (mouseup)="onMouseUp($event)"
          (dblclick)="onDoubleClick($event)">
        </svg>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f5;
    }

    .container {
      display: flex;
      height: 100%;
    }

    .sidebar {
      width: 280px;
      background: #ffffff;
      border-right: 1px solid #e0e0e0;
      padding: 20px;
      overflow-y: auto;
    }

    .canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }

    svg {
      border: 1px solid #e0e0e0;
      background: #ffffff;
    }

    h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }

    .button {
      width: 100%;
      padding: 10px 15px;
      margin-bottom: 8px;
      background: #0066FF;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .button:hover {
      background: #0052CC;
    }

    .button.secondary {
      background: #f0f0f0;
      color: #333;
    }

    .button.secondary:hover {
      background: #e0e0e0;
    }

    .button:disabled {
      background: #e0e0e0;
      color: #999;
      cursor: not-allowed;
    }

    .info {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
      padding: 12px;
      background: #f8f8f8;
      border-radius: 6px;
    }

    .state-indicator {
      display: inline-block;
      padding: 3px 8px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .keyboard-shortcuts {
      font-size: 11px;
      color: #666;
      line-height: 1.8;
    }

    .shortcut {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .key {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 10px;
    }
  `]
})
export class PenToolComponent implements AfterViewInit {
  // ViewChild reference to canvas
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<SVGSVGElement>;

  // Signals for reactive state
  mode = signal<ToolMode>('pen');
  toolState = signal<string>('IDLE');
  pathCount = signal<number>(0);
  currentPath = signal<VectorPath | null>(null);
  selectedPoints = signal<AnchorPoint[]>([]);

  // Tool instances
  private pathManager!: PathManager;
  private renderer!: PathRenderer;
  private penTool!: PenTool;
  private editMode!: EditMode;

  constructor() {
    // Setup keyboard listeners
    this.setupKeyboardListeners();
  }

  ngAfterViewInit() {
    this.initializeTools();
  }

  private initializeTools() {
    const svgElement = this.canvasRef.nativeElement;
    
    // Initialize path manager
    this.pathManager = new PathManager();

    // Initialize renderer
    this.renderer = new PathRenderer(svgElement, {
      showAllHandles: false
    });

    // Initialize pen tool
    this.penTool = new PenTool(this.pathManager, {}, {
      onPathModified: (path: VectorPath) => {
        this.renderer.update(this.pathManager);
        this.updateState();
      },
      onStateChange: (state: PenToolState) => {
        this.toolState.set(state.toUpperCase());
        this.updateState();
      },
      onClosePathHover: (canClose: boolean) => {
        if (canClose && this.penTool.getCurrentPath()) {
          const firstPoint = this.penTool.getCurrentPath()!.anchorPoints[0];
          this.renderer.renderClosePathIndicator(firstPoint.position, true);
        } else {
          this.renderer.renderClosePathIndicator({ x: 0, y: 0 }, false);
        }
      }
    });

    // Initialize edit mode
    this.editMode = new EditMode(this.pathManager, {
      onPathModified: (path: VectorPath) => {
        this.renderer.update(this.pathManager);
        this.updateState();
      },
      onSelectionChange: (points: AnchorPoint[]) => {
        this.selectedPoints.set(points);
        this.renderer.setOptions({ showAllHandles: points.length > 0 });
        this.renderer.update(this.pathManager);
      }
    });

    // Initial render
    this.renderer.update(this.pathManager);
    this.updateState();
  }

  private getMousePosition(event: MouseEvent): Point {
    if (!this.canvasRef) return { x: 0, y: 0 };
    const svg = this.canvasRef.nativeElement;
    const rect = svg.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onMouseDown(event: MouseEvent) {
    if (!this.penTool || !this.editMode) return;
    const pos = this.getMousePosition(event);
    
    if (this.mode() === 'pen') {
      this.penTool.onMouseDown(pos);
    } else {
      this.editMode.onMouseDown(pos);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.penTool || !this.editMode || !this.renderer) return;
    const pos = this.getMousePosition(event);
    
    if (this.mode() === 'pen') {
      this.penTool.onMouseMove(pos);
      
      // Render preview line if drawing
      const path = this.penTool.getCurrentPath();
      if (path && path.anchorPoints.length > 0 && this.penTool.getState() === PenToolState.Drawing) {
        const lastPoint = path.anchorPoints[path.anchorPoints.length - 1];
        this.renderer.renderPreviewLine(lastPoint.position, pos);
      }
    } else {
      this.editMode.onMouseMove(pos);
    }
  }

  onMouseUp(event: MouseEvent) {
    if (!this.penTool || !this.editMode) return;
    const pos = this.getMousePosition(event);
    
    if (this.mode() === 'pen') {
      this.penTool.onMouseUp(pos);
    } else {
      this.editMode.onMouseUp(pos);
    }
  }

  onDoubleClick(event: MouseEvent) {
    if (!this.editMode) return;
    if (this.mode() === 'edit') {
      const pos = this.getMousePosition(event);
      this.editMode.onDoubleClick(pos);
    }
  }

  toggleMode() {
    if (!this.renderer || !this.pathManager || !this.penTool) return;
    if (this.mode() === 'pen') {
      this.mode.set('edit');
      this.toolState.set('EDIT MODE');
      this.renderer.setOptions({ showAllHandles: true });
      this.renderer.clearPreview();
      this.penTool.reset();
    } else {
      this.mode.set('pen');
      this.toolState.set('IDLE');
      this.renderer.setOptions({ showAllHandles: false });
    }
    this.renderer.update(this.pathManager);
    this.updateState();
  }

  clearAllPaths() {
    if (!this.pathManager || !this.renderer || !this.penTool) return;
    const paths = this.pathManager.getAllPaths();
    paths.forEach((path: VectorPath) => this.pathManager.removePath(path.id));
    this.renderer.clear();
    this.penTool.reset();
    this.updateState();
  }

  closeCurrentPath() {
    if (!this.penTool || !this.pathManager || !this.renderer) return;
    const path = this.penTool.getCurrentPath();
    if (path) {
      this.pathManager.closePath(path);
      this.renderer.update(this.pathManager);
      this.penTool.reset();
      this.updateState();
    }
  }

  canClosePath(): boolean {
    if (!this.penTool) return false;
    const path = this.penTool.getCurrentPath();
    return path !== null && path.anchorPoints.length > 2;
  }

  private updateState() {
    if (!this.pathManager || !this.penTool) return;
    this.pathCount.set(this.pathManager.getAllPaths().length);
    this.currentPath.set(this.penTool.getCurrentPath());
  }

  private setupKeyboardListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (this.mode() === 'pen') {
          this.penTool.onKeyDown(e.key);
        } else {
          this.editMode.onKeyDown(e.key);
        }
      });

      window.addEventListener('keyup', (e) => {
        if (this.mode() === 'pen') {
          this.penTool.onKeyUp(e.key);
        } else {
          this.editMode.onKeyUp(e.key);
        }
      });
    }
  }
}
