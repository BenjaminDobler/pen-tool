import { Point, AnchorPoint, HandleMirrorMode } from './types';
import { PointUtils } from './path';

/**
 * Handle manipulation and management
 */
export class HandleManager {
  /**
   * Update a handle position while respecting mirror mode
   */
  static updateHandle(
    anchorPoint: AnchorPoint,
    isOutHandle: boolean,
    newHandlePosition: Point
  ): void {
    const relativePosition = PointUtils.subtract(newHandlePosition, anchorPoint.position);

    if (isOutHandle) {
      // Update the out handle
      if (!anchorPoint.handleOut) {
        anchorPoint.handleOut = { position: relativePosition, visible: true };
      } else {
        anchorPoint.handleOut.position = relativePosition;
        anchorPoint.handleOut.visible = true;
      }

      // Mirror to in handle based on mode
      this.mirrorHandle(anchorPoint, false);
    } else {
      // Update the in handle
      if (!anchorPoint.handleIn) {
        anchorPoint.handleIn = { position: relativePosition, visible: true };
      } else {
        anchorPoint.handleIn.position = relativePosition;
        anchorPoint.handleIn.visible = true;
      }

      // Mirror to out handle based on mode
      this.mirrorHandle(anchorPoint, true);
    }
  }

  /**
   * Mirror a handle based on the anchor point's mirror mode
   */
  private static mirrorHandle(anchorPoint: AnchorPoint, mirrorToOut: boolean): void {
    const sourceHandle = mirrorToOut ? anchorPoint.handleIn : anchorPoint.handleOut;
    const targetHandle = mirrorToOut ? anchorPoint.handleOut : anchorPoint.handleIn;

    if (!sourceHandle || !sourceHandle.visible) {
      return;
    }

    switch (anchorPoint.mirrorMode) {
      case HandleMirrorMode.Mirrored: {
        // Mirror both angle and length
        const mirrored: Point = {
          x: -sourceHandle.position.x,
          y: -sourceHandle.position.y
        };

        if (!targetHandle) {
          if (mirrorToOut) {
            anchorPoint.handleOut = { position: mirrored, visible: true };
          } else {
            anchorPoint.handleIn = { position: mirrored, visible: true };
          }
        } else {
          targetHandle.position = mirrored;
          targetHandle.visible = true;
        }
        break;
      }

      case HandleMirrorMode.AngleLocked: {
        // Mirror angle only, preserve length of target handle
        if (!targetHandle || !targetHandle.visible) {
          // If target doesn't exist, create with same length as source
          const mirrored: Point = {
            x: -sourceHandle.position.x,
            y: -sourceHandle.position.y
          };
          if (mirrorToOut) {
            anchorPoint.handleOut = { position: mirrored, visible: true };
          } else {
            anchorPoint.handleIn = { position: mirrored, visible: true };
          }
        } else {
          // Preserve target length, mirror angle
          const sourceLength = Math.sqrt(
            sourceHandle.position.x ** 2 + sourceHandle.position.y ** 2
          );
          const targetLength = Math.sqrt(
            targetHandle.position.x ** 2 + targetHandle.position.y ** 2
          );

          if (sourceLength > 0) {
            const scale = targetLength / sourceLength;
            targetHandle.position = {
              x: -sourceHandle.position.x * scale,
              y: -sourceHandle.position.y * scale
            };
          }
        }
        break;
      }

      case HandleMirrorMode.Independent:
        // Do nothing - handles are independent
        break;
    }
  }

  /**
   * Set handle mirror mode and adjust handles accordingly
   */
  static setMirrorMode(anchorPoint: AnchorPoint, mode: HandleMirrorMode): void {
    anchorPoint.mirrorMode = mode;

    // If switching to a mirroring mode, update handles
    if (mode !== HandleMirrorMode.Independent) {
      // Use the out handle as reference if it exists
      if (anchorPoint.handleOut?.visible) {
        this.mirrorHandle(anchorPoint, false);
      } else if (anchorPoint.handleIn?.visible) {
        this.mirrorHandle(anchorPoint, true);
      }
    }
  }

  /**
   * Create default handles for a point based on adjacent points
   */
  static createDefaultHandles(
    anchorPoint: AnchorPoint,
    prevPoint: Point | null,
    nextPoint: Point | null,
    handleLength = 50
  ): void {
    if (!prevPoint && !nextPoint) {
      return;
    }

    if (prevPoint && nextPoint) {
      // Point is between two other points - create smooth curve
      const angle = PointUtils.angle(prevPoint, nextPoint);
      const offset = handleLength / 3;

      anchorPoint.handleIn = {
        position: {
          x: -Math.cos(angle) * offset,
          y: -Math.sin(angle) * offset
        },
        visible: true
      };

      anchorPoint.handleOut = {
        position: {
          x: Math.cos(angle) * offset,
          y: Math.sin(angle) * offset
        },
        visible: true
      };
    } else if (prevPoint) {
      // Only previous point exists
      const angle = PointUtils.angle(prevPoint, anchorPoint.position);
      const offset = handleLength / 3;

      anchorPoint.handleIn = {
        position: {
          x: -Math.cos(angle) * offset,
          y: -Math.sin(angle) * offset
        },
        visible: true
      };
    } else if (nextPoint) {
      // Only next point exists
      const angle = PointUtils.angle(anchorPoint.position, nextPoint);
      const offset = handleLength / 3;

      anchorPoint.handleOut = {
        position: {
          x: Math.cos(angle) * offset,
          y: Math.sin(angle) * offset
        },
        visible: true
      };
    }

    anchorPoint.mirrorMode = HandleMirrorMode.Mirrored;
  }

  /**
   * Remove handles from a point (convert to straight)
   */
  static removeHandles(anchorPoint: AnchorPoint): void {
    anchorPoint.handleIn = null;
    anchorPoint.handleOut = null;
  }

  /**
   * Get absolute position of a handle in world coordinates
   */
  static getAbsoluteHandlePosition(
    anchorPoint: AnchorPoint,
    isOutHandle: boolean
  ): Point | null {
    const handle = isOutHandle ? anchorPoint.handleOut : anchorPoint.handleIn;
    if (!handle || !handle.visible) {
      return null;
    }

    return PointUtils.add(anchorPoint.position, handle.position);
  }

  /**
   * Check if a position is near a handle
   */
  static isNearHandle(
    anchorPoint: AnchorPoint,
    position: Point,
    threshold = 10
  ): { isOut: boolean; distance: number } | null {
    // Check out handle
    if (anchorPoint.handleOut?.visible) {
      const handlePos = this.getAbsoluteHandlePosition(anchorPoint, true);
      if (handlePos) {
        const distance = PointUtils.distance(position, handlePos);
        if (distance <= threshold) {
          return { isOut: true, distance };
        }
      }
    }

    // Check in handle
    if (anchorPoint.handleIn?.visible) {
      const handlePos = this.getAbsoluteHandlePosition(anchorPoint, false);
      if (handlePos) {
        const distance = PointUtils.distance(position, handlePos);
        if (distance <= threshold) {
          return { isOut: false, distance };
        }
      }
    }

    return null;
  }
}
