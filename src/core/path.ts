import {
  Point,
  AnchorPoint,
  VectorPath,
  PathSegment,
  SegmentType,
  HandleMirrorMode,
  StrokeCapStyle
} from './types';

/**
 * Utility functions for working with points
 */
export class PointUtils {
  /**
   * Calculate distance between two points
   */
  static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle between two points in radians
   */
  static angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * Add two points
   */
  static add(p1: Point, p2: Point): Point {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
  }

  /**
   * Subtract two points
   */
  static subtract(p1: Point, p2: Point): Point {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
  }

  /**
   * Scale a point by a factor
   */
  static scale(p: Point, factor: number): Point {
    return { x: p.x * factor, y: p.y * factor };
  }

  /**
   * Check if two points are equal within a tolerance
   */
  static equals(p1: Point, p2: Point, tolerance = 0.001): boolean {
    return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
  }
}

/**
 * Core path manipulation class
 */
export class PathManager {
  private paths: Map<string, VectorPath> = new Map();
  private idCounter = 0;

  /**
   * Create a new empty path
   */
  createPath(): VectorPath {
    const path: VectorPath = {
      id: this.generateId(),
      anchorPoints: [],
      closed: false,
      fill: null,
      stroke: '#000000',
      strokeWidth: 2,
      strokeCapStart: StrokeCapStyle.Round,
      strokeCapEnd: StrokeCapStyle.Round,
      selected: false
    };
    this.paths.set(path.id, path);
    return path;
  }

  /**
   * Get a path by ID
   */
  getPath(id: string): VectorPath | undefined {
    return this.paths.get(id);
  }

  /**
   * Remove a path
   */
  removePath(id: string): boolean {
    return this.paths.delete(id);
  }

  /**
   * Get all paths
   */
  getAllPaths(): VectorPath[] {
    return Array.from(this.paths.values());
  }

  /**
   * Add an anchor point to a path
   */
  addAnchorPoint(
    path: VectorPath,
    position: Point,
    handleIn: Point | null = null,
    handleOut: Point | null = null
  ): AnchorPoint {
    const anchorPoint: AnchorPoint = {
      id: this.generateId(),
      position,
      handleIn: handleIn ? { position: handleIn, visible: true } : null,
      handleOut: handleOut ? { position: handleOut, visible: true } : null,
      mirrorMode: HandleMirrorMode.Mirrored,
      cornerRadius: 0,
      selected: false
    };

    path.anchorPoints.push(anchorPoint);
    return anchorPoint;
  }

  /**
   * Insert an anchor point at a specific index
   */
  insertAnchorPoint(
    path: VectorPath,
    index: number,
    position: Point,
    handleIn: Point | null = null,
    handleOut: Point | null = null
  ): AnchorPoint {
    const anchorPoint: AnchorPoint = {
      id: this.generateId(),
      position,
      handleIn: handleIn ? { position: handleIn, visible: true } : null,
      handleOut: handleOut ? { position: handleOut, visible: true } : null,
      mirrorMode: HandleMirrorMode.Mirrored,
      cornerRadius: 0,
      selected: false
    };

    path.anchorPoints.splice(index, 0, anchorPoint);
    return anchorPoint;
  }

  /**
   * Remove an anchor point from a path
   */
  removeAnchorPoint(path: VectorPath, pointId: string): boolean {
    const index = path.anchorPoints.findIndex(p => p.id === pointId);
    if (index !== -1) {
      path.anchorPoints.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Move an anchor point
   */
  moveAnchorPoint(path: VectorPath, pointId: string, newPosition: Point): boolean {
    const point = path.anchorPoints.find(p => p.id === pointId);
    if (point) {
      point.position = newPosition;
      return true;
    }
    return false;
  }

  /**
   * Close a path
   */
  closePath(path: VectorPath): void {
    path.closed = true;
  }

  /**
   * Open a path
   */
  openPath(path: VectorPath): void {
    path.closed = false;
  }

  /**
   * Get all segments of a path
   */
  getSegments(path: VectorPath): PathSegment[] {
    const segments: PathSegment[] = [];
    const points = path.anchorPoints;

    if (points.length < 2) {
      return segments;
    }

    const loopEnd = path.closed ? points.length : points.length - 1;

    for (let i = 0; i < loopEnd; i++) {
      const startPoint = points[i];
      const endPoint = points[(i + 1) % points.length];

      // Determine if this is a line or curve segment
      const hasOutHandle = startPoint.handleOut?.visible;
      const hasInHandle = endPoint.handleIn?.visible;

      if (hasOutHandle || hasInHandle) {
        // Cubic Bezier curve
        const cp1 = hasOutHandle
          ? PointUtils.add(startPoint.position, startPoint.handleOut!.position)
          : startPoint.position;
        const cp2 = hasInHandle
          ? PointUtils.add(endPoint.position, endPoint.handleIn!.position)
          : endPoint.position;

        segments.push({
          type: SegmentType.CubicBezier,
          startPoint,
          endPoint,
          controlPoint1: cp1,
          controlPoint2: cp2
        });
      } else {
        // Straight line
        segments.push({
          type: SegmentType.Line,
          startPoint,
          endPoint
        });
      }
    }

    return segments;
  }

  /**
   * Generate SVG path data string from a path
   */
  toSVGPath(path: VectorPath): string {
    const segments = this.getSegments(path);
    if (segments.length === 0) {
      return '';
    }

    const parts: string[] = [];
    const firstPoint = segments[0].startPoint.position;
    parts.push(`M ${firstPoint.x} ${firstPoint.y}`);

    for (const segment of segments) {
      if (segment.type === SegmentType.Line) {
        parts.push(`L ${segment.endPoint.position.x} ${segment.endPoint.position.y}`);
      } else if (segment.type === SegmentType.CubicBezier) {
        const cp1 = segment.controlPoint1!;
        const cp2 = segment.controlPoint2!;
        const end = segment.endPoint.position;
        parts.push(`C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`);
      }
    }

    if (path.closed) {
      parts.push('Z');
    }

    return parts.join(' ');
  }

  /**
   * Find the closest point on a path to a given position
   */
  findClosestPointOnPath(
    path: VectorPath,
    position: Point,
    threshold = 10
  ): { anchorPoint: AnchorPoint; distance: number } | null {
    let closest: { anchorPoint: AnchorPoint; distance: number } | null = null;

    for (const point of path.anchorPoints) {
      const distance = PointUtils.distance(position, point.position);
      if (distance <= threshold) {
        if (!closest || distance < closest.distance) {
          closest = { anchorPoint: point, distance };
        }
      }
    }

    return closest;
  }

  /**
   * Calculate a point on a cubic Bezier curve at parameter t (0 to 1)
   */
  static cubicBezierPoint(
    p0: Point,
    cp1: Point,
    cp2: Point,
    p1: Point,
    t: number
  ): Point {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p1.x,
      y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p1.y
    };
  }

  /**
   * Linear interpolation between two points
   */
  static lerp(p0: Point, p1: Point, t: number): Point {
    return {
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y)
    };
  }

  /**
   * Subdivide a cubic Bezier curve at parameter t
   * Returns the control points for both resulting curves
   */
  static subdivideCubicBezier(
    p0: Point,
    cp1: Point,
    cp2: Point,
    p3: Point,
    t: number
  ): {
    curve1: { p0: Point; cp1: Point; cp2: Point; p3: Point };
    curve2: { p0: Point; cp1: Point; cp2: Point; p3: Point };
  } {
    // De Casteljau's algorithm for subdivision
    const p01 = PathManager.lerp(p0, cp1, t);
    const p12 = PathManager.lerp(cp1, cp2, t);
    const p23 = PathManager.lerp(cp2, p3, t);

    const p012 = PathManager.lerp(p01, p12, t);
    const p123 = PathManager.lerp(p12, p23, t);

    const p0123 = PathManager.lerp(p012, p123, t);

    return {
      curve1: {
        p0: p0,
        cp1: p01,
        cp2: p012,
        p3: p0123
      },
      curve2: {
        p0: p0123,
        cp1: p123,
        cp2: p23,
        p3: p3
      }
    };
  }

  private generateId(): string {
    return `point-${this.idCounter++}`;
  }
}
