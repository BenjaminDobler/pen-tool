import { Point, VectorPath, AnchorPoint, HandleMirrorMode, SegmentType } from '../core/types';
import { PathManager, PointUtils } from '../core/path';
import { HandleManager } from '../core/handles';

export interface EditModeOptions {
  /** Distance threshold for path hit detection (default: 5) */
  hoverDistance?: number;
}

export interface EditModeCallbacks {
  /** Called when selection changes */
  onSelectionChange?: (points: AnchorPoint[]) => void;
  /** Called when path is modified */
  onPathModified?: (path: VectorPath) => void;
  /** Called when hovering near a path with the preview point */
  onHoverPreview?: (point: Point | null, path: VectorPath | null) => void;
}

/**
 * Edit mode for manipulating existing paths
 */
export class EditMode {
  private pathManager: PathManager;
  private selectedPoints: Set<string> = new Set();
  private callbacks: EditModeCallbacks;
  private options: Required<EditModeOptions>;

  // Interaction state
  private isDragging = false;
  private dragType: 'point' | 'handle-in' | 'handle-out' | null = null;
  private dragTarget: { path: VectorPath; point: AnchorPoint } | null = null;
  private dragStartPos: Point | null = null;
  private initialPointPos: Point | null = null;
  private isShiftPressed = false;
  private isAltPressed = false;
  private originalMirrorMode: HandleMirrorMode | null = null;

  // Hover preview state
  private hoverPreviewPoint: Point | null = null;
  private hoverPreviewPath: VectorPath | null = null;

  constructor(
    pathManager: PathManager,
    callbacks: EditModeCallbacks = {},
    options: EditModeOptions = {}
  ) {
    this.pathManager = pathManager;
    this.callbacks = callbacks;
    this.options = {
      hoverDistance: options.hoverDistance ?? 5
    };
  }

  /**
   * Handle mouse down in edit mode
   */
  onMouseDown(position: Point): boolean {
    // Check all paths for hit detection
    const allPaths = this.pathManager.getAllPaths();

    // First, check for handle hits (they have priority)
    for (const path of allPaths) {
      for (const point of path.anchorPoints) {
        const handleHit = HandleManager.isNearHandle(point, position, 8);
        if (handleHit) {
          this.startDraggingHandle(path, point, handleHit.isOut);
          this.dragStartPos = position;
          return true;
        }
      }
    }

    // Then check for anchor point hits
    for (const path of allPaths) {
      const hit = this.pathManager.findClosestPointOnPath(path, position, 8);
      if (hit) {
        this.startDraggingPoint(path, hit.anchorPoint);
        this.dragStartPos = position;
        this.initialPointPos = { ...hit.anchorPoint.position };
        return true;
      }
    }

    // No hit - clear selection unless shift is pressed
    if (!this.isShiftPressed) {
      this.clearSelection();
    }

    return false;
  }

  /**
   * Handle mouse move in edit mode
   */
  onMouseMove(position: Point): void {
    // Update hover preview when not dragging
    if (!this.isDragging) {
      this.updateHoverPreview(position);
      return;
    }

    if (!this.dragTarget || !this.dragStartPos) {
      return;
    }

    const { path, point } = this.dragTarget;

    if (this.dragType === 'point' && this.initialPointPos) {
      // Move the anchor point
      const delta = PointUtils.subtract(position, this.dragStartPos);
      const newPosition = PointUtils.add(this.initialPointPos, delta);
      this.pathManager.moveAnchorPoint(path, point.id, newPosition);
      this.notifyPathModified(path);
    } else if (this.dragType === 'handle-in' || this.dragType === 'handle-out') {
      // Move the handle
      const isOut = this.dragType === 'handle-out';
      
      // Temporarily set to independent mode if Alt is pressed
      if (this.isAltPressed && this.originalMirrorMode === null) {
        this.originalMirrorMode = point.mirrorMode;
        point.mirrorMode = HandleMirrorMode.Independent;
      } else if (!this.isAltPressed && this.originalMirrorMode !== null) {
        point.mirrorMode = this.originalMirrorMode;
        this.originalMirrorMode = null;
      }
      
      HandleManager.updateHandle(point, isOut, position);
      this.notifyPathModified(path);
    }
  }

  /**
   * Handle mouse up in edit mode
   */
  onMouseUp(_position: Point): void {
    // Restore original mirror mode if Alt was pressed
    if (this.originalMirrorMode !== null && this.dragTarget) {
      this.dragTarget.point.mirrorMode = this.originalMirrorMode;
      this.originalMirrorMode = null;
    }
    
    this.isDragging = false;
    this.dragType = null;
    this.dragTarget = null;
    this.dragStartPos = null;
    this.initialPointPos = null;
  }

  /**
   * Handle double-click to add point to path
   */
  onDoubleClick(_position: Point): boolean {
    // If we have a hover preview, use that point
    if (this.hoverPreviewPoint && this.hoverPreviewPath) {
      const path = this.hoverPreviewPath;
      const segments = this.pathManager.getSegments(path);

      // Find which segment the preview point is on
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const result = this.findClosestPointOnSegment(segment, this.hoverPreviewPoint);

        if (result && result.distance < 1) {
          const startPoint = segment.startPoint;
          const endPoint = segment.endPoint;

          // Add the new point at the exact position
          const newPoint = this.pathManager.insertAnchorPoint(
            path,
            i + 1,
            this.hoverPreviewPoint
          );

          // Subdivide the curve properly
          if (segment.type === SegmentType.CubicBezier && segment.controlPoint1 && segment.controlPoint2) {
            // Subdivide the Bezier curve at parameter t
            const subdivided = PathManager.subdivideCubicBezier(
              startPoint.position,
              segment.controlPoint1,
              segment.controlPoint2,
              endPoint.position,
              result.t
            );

            // Update handles for the start point (first curve)
            if (startPoint.handleOut) {
              // Convert absolute control point back to relative handle
              startPoint.handleOut.position = {
                x: subdivided.curve1.cp1.x - startPoint.position.x,
                y: subdivided.curve1.cp1.y - startPoint.position.y
              };
            }

            // Set handles for the new point (connection between curves)
            newPoint.handleIn = {
              position: {
                x: subdivided.curve1.cp2.x - newPoint.position.x,
                y: subdivided.curve1.cp2.y - newPoint.position.y
              },
              visible: true
            };
            newPoint.handleOut = {
              position: {
                x: subdivided.curve2.cp1.x - newPoint.position.x,
                y: subdivided.curve2.cp1.y - newPoint.position.y
              },
              visible: true
            };

            // Update handles for the end point (second curve)
            if (endPoint.handleIn) {
              endPoint.handleIn.position = {
                x: subdivided.curve2.cp2.x - endPoint.position.x,
                y: subdivided.curve2.cp2.y - endPoint.position.y
              };
            }
          } else {
            // For line segments, create simple handles
            HandleManager.createDefaultHandles(
              newPoint,
              startPoint.position,
              endPoint.position
            );
          }

          this.selectPoint(newPoint);
          this.notifyPathModified(path);
          this.clearHoverPreview();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle keyboard events
   */
  onKeyDown(key: string): void {
    if (key === 'Shift') {
      this.isShiftPressed = true;
    } else if (key === 'Alt') {
      this.isAltPressed = true;
    } else if (key === 'Delete' || key === 'Backspace') {
      this.deleteSelectedPoints();
    }
  }

  /**
   * Handle keyboard up events
   */
  onKeyUp(key: string): void {
    if (key === 'Shift') {
      this.isShiftPressed = false;
    } else if (key === 'Alt') {
      this.isAltPressed = false;
      // Restore original mirror mode if we were dragging
      if (this.originalMirrorMode !== null && this.dragTarget) {
        this.dragTarget.point.mirrorMode = this.originalMirrorMode;
        this.originalMirrorMode = null;
      }
    }
  }

  /**
   * Delete selected points
   */
  private deleteSelectedPoints(): void {
    const allPaths = this.pathManager.getAllPaths();

    for (const path of allPaths) {
      const pointsToDelete = path.anchorPoints.filter(p =>
        this.selectedPoints.has(p.id)
      );

      for (const point of pointsToDelete) {
        this.pathManager.removeAnchorPoint(path, point.id);
        this.selectedPoints.delete(point.id);
      }

      if (pointsToDelete.length > 0) {
        this.notifyPathModified(path);
      }
    }

    this.notifySelectionChange();
  }

  /**
   * Start dragging a point
   */
  private startDraggingPoint(path: VectorPath, point: AnchorPoint): void {
    this.isDragging = true;
    this.dragType = 'point';
    this.dragTarget = { path, point };

    if (!this.isShiftPressed) {
      this.clearSelection();
    }
    this.selectPoint(point);
  }

  /**
   * Start dragging a handle
   */
  private startDraggingHandle(path: VectorPath, point: AnchorPoint, isOut: boolean): void {
    this.isDragging = true;
    this.dragType = isOut ? 'handle-out' : 'handle-in';
    this.dragTarget = { path, point };
  }

  /**
   * Select a point
   */
  private selectPoint(point: AnchorPoint): void {
    point.selected = true;
    this.selectedPoints.add(point.id);
    this.notifySelectionChange();
  }

  /**
   * Clear selection
   */
  private clearSelection(): void {
    const allPaths = this.pathManager.getAllPaths();

    for (const path of allPaths) {
      for (const point of path.anchorPoints) {
        if (point.selected) {
          point.selected = false;
        }
      }
    }

    this.selectedPoints.clear();
    this.notifySelectionChange();
  }

  /**
   * Find closest point on a segment
   */
  private findClosestPointOnSegment(
    segment: any,
    position: Point
  ): { position: Point; distance: number; t: number } | null {
    let minDistance = Infinity;
    let closestPoint: Point | null = null;
    let closestT = 0;

    // Sample points along the segment
    const samples = 50; // Increased samples for better accuracy
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      let point: Point;

      if (segment.type === 'line') {
        point = {
          x: (1 - t) * segment.startPoint.position.x + t * segment.endPoint.position.x,
          y: (1 - t) * segment.startPoint.position.y + t * segment.endPoint.position.y
        };
      } else {
        point = PathManager.cubicBezierPoint(
          segment.startPoint.position,
          segment.controlPoint1,
          segment.controlPoint2,
          segment.endPoint.position,
          t
        );
      }

      const distance = PointUtils.distance(position, point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
        closestT = t;
      }
    }

    return closestPoint ? { position: closestPoint, distance: minDistance, t: closestT } : null;
  }

  /**
   * Notify selection change
   */
  private notifySelectionChange(): void {
    if (this.callbacks.onSelectionChange) {
      const selectedPointsList: AnchorPoint[] = [];
      const allPaths = this.pathManager.getAllPaths();

      for (const path of allPaths) {
        for (const point of path.anchorPoints) {
          if (this.selectedPoints.has(point.id)) {
            selectedPointsList.push(point);
          }
        }
      }

      this.callbacks.onSelectionChange(selectedPointsList);
    }
  }

  /**
   * Notify path modified
   */
  private notifyPathModified(path: VectorPath): void {
    if (this.callbacks.onPathModified) {
      this.callbacks.onPathModified(path);
    }
  }

  /**
   * Get selected points
   */
  getSelectedPoints(): AnchorPoint[] {
    const selected: AnchorPoint[] = [];
    const allPaths = this.pathManager.getAllPaths();

    for (const path of allPaths) {
      for (const point of path.anchorPoints) {
        if (this.selectedPoints.has(point.id)) {
          selected.push(point);
        }
      }
    }

    return selected;
  }

  /**
   * Update hover preview when mouse is near a path
   */
  private updateHoverPreview(position: Point): void {
    const allPaths = this.pathManager.getAllPaths();
    let closestPoint: Point | null = null;
    let closestPath: VectorPath | null = null;
    let minDistance = Infinity;

    // Find the closest point on any path
    for (const path of allPaths) {
      const segments = this.pathManager.getSegments(path);

      for (const segment of segments) {
        const result = this.findClosestPointOnSegment(segment, position);
        if (result && result.distance < minDistance && result.distance <= this.options.hoverDistance) {
          closestPoint = result.position;
          closestPath = path;
          minDistance = result.distance;
        }
      }
    }

    // Update preview if changed
    if (closestPoint && closestPath) {
      const changed = !this.hoverPreviewPoint || 
        this.hoverPreviewPoint.x !== closestPoint.x || 
        this.hoverPreviewPoint.y !== closestPoint.y ||
        this.hoverPreviewPath !== closestPath;
      
      if (changed) {
        this.hoverPreviewPoint = closestPoint;
        this.hoverPreviewPath = closestPath;
        this.notifyHoverPreview();
      }
    } else if (this.hoverPreviewPoint) {
      // Clear preview if no longer near a path
      this.clearHoverPreview();
    }
  }

  /**
   * Clear hover preview
   */
  private clearHoverPreview(): void {
    this.hoverPreviewPoint = null;
    this.hoverPreviewPath = null;
    this.notifyHoverPreview();
  }

  /**
   * Notify hover preview change
   */
  private notifyHoverPreview(): void {
    if (this.callbacks.onHoverPreview) {
      this.callbacks.onHoverPreview(this.hoverPreviewPoint, this.hoverPreviewPath);
    }
  }

  /**
   * Set hover distance threshold
   */
  setHoverDistance(distance: number): void {
    this.options.hoverDistance = distance;
  }

  /**
   * Get current hover distance
   */
  getHoverDistance(): number {
    return this.options.hoverDistance;
  }
}
