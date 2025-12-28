/**
 * Basic 2D point with x, y coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Handle mirroring modes for Bezier control points
 * - Mirrored: Both handles have same angle (180°) and same length
 * - AngleLocked: Handles maintain 180° angle but can have different lengths
 * - Independent: Handles can move completely independently
 */
export enum HandleMirrorMode {
  Mirrored = 'mirrored',
  AngleLocked = 'angle-locked',
  Independent = 'independent'
}

/**
 * Type of path segment
 * - Line: Straight line between two anchor points
 * - CubicBezier: Cubic Bezier curve with two control points
 * - QuadraticBezier: Quadratic Bezier curve with one control point (future extension)
 */
export enum SegmentType {
  Line = 'line',
  CubicBezier = 'cubic-bezier',
  QuadraticBezier = 'quadratic-bezier'
}

/**
 * Bezier handle (control point) for curved segments
 */
export interface BezierHandle {
  /** Position relative to anchor point */
  position: Point;
  /** Whether this handle is visible/active */
  visible: boolean;
}

/**
 * Anchor point on a vector path
 */
export interface AnchorPoint {
  /** Unique identifier for this point */
  id: string;
  /** Position of the anchor point */
  position: Point;
  /** Handle for incoming curve (before this point) */
  handleIn: BezierHandle | null;
  /** Handle for outgoing curve (after this point) */
  handleOut: BezierHandle | null;
  /** Handle mirroring mode */
  mirrorMode: HandleMirrorMode;
  /** Corner radius for this point (0 = sharp corner) */
  cornerRadius: number;
  /** Whether this point is currently selected */
  selected: boolean;
}

/**
 * A segment of a path between two anchor points
 */
export interface PathSegment {
  /** Type of segment */
  type: SegmentType;
  /** Starting anchor point */
  startPoint: AnchorPoint;
  /** Ending anchor point */
  endPoint: AnchorPoint;
  /** First control point (for cubic Bezier) */
  controlPoint1?: Point;
  /** Second control point (for cubic Bezier) */
  controlPoint2?: Point;
}

/**
 * Cap style for open path endpoints
 */
export enum StrokeCapStyle {
  None = 'none',
  Round = 'round',
  Square = 'square',
  LineArrow = 'line-arrow',
  TriangleArrow = 'triangle-arrow',
  CircleArrow = 'circle-arrow'
}

/**
 * A complete vector path
 */
export interface VectorPath {
  /** Unique identifier for this path */
  id: string;
  /** Array of anchor points */
  anchorPoints: AnchorPoint[];
  /** Whether the path is closed (connected end-to-start) */
  closed: boolean;
  /** Fill color (null for no fill) */
  fill: string | null;
  /** Stroke color */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Cap style for start point (open paths only) */
  strokeCapStart: StrokeCapStyle;
  /** Cap style for end point (open paths only) */
  strokeCapEnd: StrokeCapStyle;
  /** Whether this path is currently selected */
  selected: boolean;
}

/**
 * Tool state for the pen tool
 */
export enum PenToolState {
  Idle = 'idle',
  Drawing = 'drawing',
  DraggingHandle = 'dragging-handle',
  EditMode = 'edit-mode'
}

/**
 * Event data for path modifications
 */
export interface PathModificationEvent {
  path: VectorPath;
  type: 'point-added' | 'point-removed' | 'point-moved' | 'handle-adjusted' | 'path-closed';
}
