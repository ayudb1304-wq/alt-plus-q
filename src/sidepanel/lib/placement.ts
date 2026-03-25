import type { CanvasItem, ViewportState } from '../../types/board';

const DEFAULT_W = 240;
const EST_H = 100;   // conservative height estimate for overlap detection
const MARGIN = 16;   // minimum gap between items
const PAD = 24;      // padding from viewport edge

/**
 * Finds the first free canvas position in the current viewport using a grid scan.
 * Falls back to viewport center if no empty space is found.
 *
 * @param viewport  Current viewport state
 * @param panelW    Panel width in pixels
 * @param panelH    Panel height in pixels (toolbar already excluded)
 * @param existingItems  Items already on canvas (used for overlap checks)
 */
export function findFreePosition(
  viewport: ViewportState,
  panelW: number,
  panelH: number,
  existingItems: CanvasItem[]
): { x: number; y: number } {
  const { x: vpX, y: vpY, zoom } = viewport;

  // Viewport bounds in canvas space where a new item can start
  const vLeft  = Math.ceil(-vpX / zoom) + PAD;
  const vTop   = Math.ceil(-vpY / zoom) + PAD;
  const vRight  = Math.floor((panelW - vpX) / zoom) - DEFAULT_W - PAD;
  const vBottom = Math.floor((panelH - vpY) / zoom) - EST_H - PAD;

  if (vRight >= vLeft && vBottom >= vTop) {
    const stepX = DEFAULT_W + MARGIN;
    const stepY = EST_H + MARGIN;

    for (let cy = vTop; cy <= vBottom; cy += stepY) {
      for (let cx = vLeft; cx <= vRight; cx += stepX) {
        if (!overlapsAny(cx, cy, existingItems)) {
          return { x: Math.round(cx), y: Math.round(cy) };
        }
      }
    }
  }

  // No free space — place at viewport center (on top of existing items)
  return {
    x: Math.round((panelW / 2 - vpX) / zoom),
    y: Math.round((panelH / 2 - vpY) / zoom),
  };
}

function overlapsAny(x: number, y: number, items: CanvasItem[]): boolean {
  const r = x + DEFAULT_W + MARGIN;
  const b = y + EST_H + MARGIN;
  return items.some((item) => {
    const ir = item.position.x + (item.width ?? DEFAULT_W) + MARGIN;
    const ib = item.position.y + EST_H + MARGIN;
    return !(r <= item.position.x || x >= ir || b <= item.position.y || y >= ib);
  });
}
