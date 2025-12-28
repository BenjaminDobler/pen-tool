import { Point } from '../core/types';
import { PathManager } from '../core/path';

export interface RenderOptions {
  /** Stroke color for paths */
  strokeColor?: string;
  /** Stroke width for paths */
  strokeWidth?: number;
  /** Fill color for closed paths */
  fillColor?: string;
  /** Color for selected elements */
  selectionColor?: string;
  /** Color for anchor points */
  anchorPointColor?: string;
  /** Size of anchor points */
  anchorPointSize?: number;
  /** Color for handles */
  handleColor?: string;
  /** Color for preview elements */
  previewColor?: string;
  /** Show handles for all points or only selected */
  showAllHandles?: boolean;
}

/**
 * Interface for path renderers
 * Can be implemented by SVG, Canvas, or other rendering backends
 */
export interface IPathRenderer {
  /**
   * Render all paths from the path manager
   */
  renderPaths(pathManager: PathManager): void;

  /**
   * Render all anchor points
   */
  renderAnchorPoints(pathManager: PathManager): void;

  /**
   * Render all handles
   */
  renderHandles(pathManager: PathManager): void;

  /**
   * Render a preview line
   */
  renderPreviewLine(from: Point, to: Point): void;

  /**
   * Render a preview curve (cubic Bezier)
   */
  renderPreviewCurve(startPoint: Point, controlPoint1: Point, controlPoint2: Point, endPoint: Point): void;

  /**
   * Render close path indicator
   */
  renderClosePathIndicator(point: Point, show: boolean): void;

  /**
   * Render hover preview point for adding to paths
   */
  renderHoverPreviewPoint(point: Point | null): void;

  /**
   * Update the entire view
   */
  update(pathManager: PathManager): void;

  /**
   * Clear all rendered elements
   */
  clear(): void;

  /**
   * Clear preview elements only
   */
  clearPreview(): void;

  /**
   * Set render options
   */
  setOptions(options: Partial<RenderOptions>): void;
}
