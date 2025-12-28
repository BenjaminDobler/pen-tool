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

  /**
   * Import a path from SVG path data (d attribute)
   */
  importFromSVG(pathData: string, options: {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  } = {}): VectorPath | null {
    try {
      const path = this.createPath();
      
      // Apply styling options
      if (options.stroke) path.stroke = options.stroke;
      if (options.strokeWidth) path.strokeWidth = options.strokeWidth;
      if (options.fill) path.fill = options.fill;

      const commands = this.parseSVGPath(pathData);
      let currentPoint: Point = { x: 0, y: 0 };
      let lastControlPoint: Point | null = null;

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];

        switch (cmd.type) {
          case 'M': // Move to (absolute)
            currentPoint = { x: cmd.x!, y: cmd.y! };
            if (path.anchorPoints.length === 0) {
              this.addAnchorPoint(path, currentPoint);
            }
            break;

          case 'm': // Move to (relative)
            currentPoint = { x: currentPoint.x + cmd.x!, y: currentPoint.y + cmd.y! };
            if (path.anchorPoints.length === 0) {
              this.addAnchorPoint(path, currentPoint);
            }
            break;

          case 'L': // Line to (absolute)
            currentPoint = { x: cmd.x!, y: cmd.y! };
            this.addAnchorPoint(path, currentPoint);
            lastControlPoint = null;
            break;

          case 'l': // Line to (relative)
            currentPoint = { x: currentPoint.x + cmd.x!, y: currentPoint.y + cmd.y! };
            this.addAnchorPoint(path, currentPoint);
            lastControlPoint = null;
            break;

          case 'H': // Horizontal line (absolute)
            currentPoint = { x: cmd.x!, y: currentPoint.y };
            this.addAnchorPoint(path, currentPoint);
            lastControlPoint = null;
            break;

          case 'h': // Horizontal line (relative)
            currentPoint = { x: currentPoint.x + cmd.x!, y: currentPoint.y };
            this.addAnchorPoint(path, currentPoint);
            lastControlPoint = null;
            break;

          case 'V': // Vertical line (absolute)
            currentPoint = { x: currentPoint.x, y: cmd.y! };
            this.addAnchorPoint(path, currentPoint);
            lastControlPoint = null;
            break;

          case 'v': // Vertical line (relative)
            currentPoint = { x: currentPoint.x, y: currentPoint.y + cmd.y! };
            this.addAnchorPoint(path, currentPoint);
            lastControlPoint = null;
            break;

          case 'C': // Cubic Bezier (absolute)
            {
              const cp1 = { x: cmd.x1!, y: cmd.y1! };
              const cp2 = { x: cmd.x2!, y: cmd.y2! };
              const endPoint = { x: cmd.x!, y: cmd.y! };

              // Set handleOut for previous point
              const prevPoint = path.anchorPoints[path.anchorPoints.length - 1];
              if (prevPoint) {
                prevPoint.handleOut = {
                  position: { x: cp1.x - prevPoint.position.x, y: cp1.y - prevPoint.position.y },
                  visible: true
                };
              }

              // Add new point with handleIn
              const newPoint = this.addAnchorPoint(path, endPoint);
              newPoint.handleIn = {
                position: { x: cp2.x - endPoint.x, y: cp2.y - endPoint.y },
                visible: true
              };

              currentPoint = endPoint;
              lastControlPoint = cp2;
            }
            break;

          case 'c': // Cubic Bezier (relative)
            {
              const cp1 = { x: currentPoint.x + cmd.x1!, y: currentPoint.y + cmd.y1! };
              const cp2 = { x: currentPoint.x + cmd.x2!, y: currentPoint.y + cmd.y2! };
              const endPoint = { x: currentPoint.x + cmd.x!, y: currentPoint.y + cmd.y! };

              // Set handleOut for previous point
              const prevPoint = path.anchorPoints[path.anchorPoints.length - 1];
              if (prevPoint) {
                prevPoint.handleOut = {
                  position: { x: cp1.x - prevPoint.position.x, y: cp1.y - prevPoint.position.y },
                  visible: true
                };
              }

              // Add new point with handleIn
              const newPoint = this.addAnchorPoint(path, endPoint);
              newPoint.handleIn = {
                position: { x: cp2.x - endPoint.x, y: cp2.y - endPoint.y },
                visible: true
              };

              currentPoint = endPoint;
              lastControlPoint = cp2;
            }
            break;

          case 'S': // Smooth cubic Bezier (absolute)
          case 's': // Smooth cubic Bezier (relative)
            {
              // S command reflects the previous control point
              const prevPoint = path.anchorPoints[path.anchorPoints.length - 1];
              let cp1: Point;
              
              if (lastControlPoint && prevPoint) {
                // Reflect last control point
                cp1 = {
                  x: 2 * prevPoint.position.x - lastControlPoint.x,
                  y: 2 * prevPoint.position.y - lastControlPoint.y
                };
              } else {
                cp1 = currentPoint;
              }

              const isRelative = cmd.type === 's';
              const cp2 = isRelative 
                ? { x: currentPoint.x + cmd.x2!, y: currentPoint.y + cmd.y2! }
                : { x: cmd.x2!, y: cmd.y2! };
              const endPoint = isRelative
                ? { x: currentPoint.x + cmd.x!, y: currentPoint.y + cmd.y! }
                : { x: cmd.x!, y: cmd.y! };

              // Set handleOut for previous point
              if (prevPoint) {
                prevPoint.handleOut = {
                  position: { x: cp1.x - prevPoint.position.x, y: cp1.y - prevPoint.position.y },
                  visible: true
                };
              }

              // Add new point with handleIn
              const newPoint = this.addAnchorPoint(path, endPoint);
              newPoint.handleIn = {
                position: { x: cp2.x - endPoint.x, y: cp2.y - endPoint.y },
                visible: true
              };

              currentPoint = endPoint;
              lastControlPoint = cp2;
            }
            break;

          case 'Z':
          case 'z':
            // Close path
            path.closed = true;
            break;
        }
      }

      return path;
    } catch (error) {
      console.error('Failed to import SVG path:', error);
      return null;
    }
  }

  /**
   * Parse SVG path data into commands
   */
  private parseSVGPath(pathData: string): Array<{
    type: string;
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }> {
    const commands: Array<any> = [];
    const regex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = regex.exec(pathData)) !== null) {
      const type = match[1];
      const args = match[2].trim();
      
      if (args.length === 0 && (type === 'Z' || type === 'z')) {
        commands.push({ type });
        continue;
      }

      const values = args.match(/-?[\d.]+/g)?.map(parseFloat) || [];
      
      switch (type.toUpperCase()) {
        case 'M':
        case 'L':
          for (let i = 0; i < values.length; i += 2) {
            commands.push({
              type: i === 0 ? type : (type === 'M' ? 'L' : 'l'),
              x: values[i],
              y: values[i + 1]
            });
          }
          break;

        case 'H':
          for (const value of values) {
            commands.push({ type, x: value });
          }
          break;

        case 'V':
          for (const value of values) {
            commands.push({ type, y: value });
          }
          break;

        case 'C':
          for (let i = 0; i < values.length; i += 6) {
            commands.push({
              type,
              x1: values[i],
              y1: values[i + 1],
              x2: values[i + 2],
              y2: values[i + 3],
              x: values[i + 4],
              y: values[i + 5]
            });
          }
          break;

        case 'S':
          for (let i = 0; i < values.length; i += 4) {
            commands.push({
              type,
              x2: values[i],
              y2: values[i + 1],
              x: values[i + 2],
              y: values[i + 3]
            });
          }
          break;

        case 'Q':
          for (let i = 0; i < values.length; i += 4) {
            commands.push({
              type,
              x1: values[i],
              y1: values[i + 1],
              x: values[i + 2],
              y: values[i + 3]
            });
          }
          break;

        case 'T':
          for (let i = 0; i < values.length; i += 2) {
            commands.push({
              type,
              x: values[i],
              y: values[i + 1]
            });
          }
          break;

        case 'A':
          for (let i = 0; i < values.length; i += 7) {
            commands.push({
              type,
              rx: values[i],
              ry: values[i + 1],
              rotation: values[i + 2],
              largeArc: values[i + 3],
              sweep: values[i + 4],
              x: values[i + 5],
              y: values[i + 6]
            });
          }
          break;
      }
    }

    return commands;
  }

  /**
   * Import all paths from an SVG element
   */
  importFromSVGElement(svgElement: SVGSVGElement): VectorPath[] {
    const importedPaths: VectorPath[] = [];
    const pathElements = svgElement.querySelectorAll('path');

    pathElements.forEach(pathElement => {
      const d = pathElement.getAttribute('d');
      if (d) {
        const path = this.importFromSVG(d, {
          stroke: pathElement.getAttribute('stroke') || undefined,
          strokeWidth: parseFloat(pathElement.getAttribute('stroke-width') || '2'),
          fill: pathElement.getAttribute('fill') || undefined
        });
        
        if (path) {
          importedPaths.push(path);
        }
      }
    });

    return importedPaths;
  }

  private generateId(): string {
    return `point-${this.idCounter++}`;
  }
}
