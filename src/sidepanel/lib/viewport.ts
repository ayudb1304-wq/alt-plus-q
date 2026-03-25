import { useBoardStore } from '../store/boardStore';
import { findFreePosition as _findFreePosition } from './placement';
import type { CanvasItem } from '../../types/board';

const TOOLBAR_HEIGHT = 48;

/** Returns the canvas-space coordinates of the visible viewport center. */
export function getViewportCenter(offsetIndex = 0): { x: number; y: number } {
  const { x, y, zoom } = useBoardStore.getState().viewport;
  const canvasW = window.innerWidth;
  const canvasH = window.innerHeight - TOOLBAR_HEIGHT;
  return {
    x: Math.round((canvasW / 2 - x) / zoom) + offsetIndex * 20,
    y: Math.round((canvasH / 2 - y) / zoom) + offsetIndex * 20,
  };
}

/**
 * Finds a free canvas position in the current viewport.
 * Falls back to viewport center if no empty space exists.
 */
export function findFreePosition(existingItems: CanvasItem[]): { x: number; y: number } {
  const { viewport } = useBoardStore.getState();
  return _findFreePosition(
    viewport,
    window.innerWidth,
    window.innerHeight - TOOLBAR_HEIGHT,
    existingItems
  );
}
