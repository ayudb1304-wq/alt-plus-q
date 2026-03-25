import { useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { pushUndo } from '../lib/undo';

export function useDrag(id: string) {
  const updateItem = useBoardStore((s) => s.updateItem);
  const wasDragging = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();

    wasDragging.current = false;
    const startX = e.clientX;
    const startY = e.clientY;

    // Determine which items to drag: all selected if this item is selected, else just this one
    const { items, selectedIds } = useBoardStore.getState();
    const dragIds = selectedIds.has(id) ? [...selectedIds] : [id];

    // Snapshot starting positions for all dragged items
    const startPositions = new Map<string, { x: number; y: number }>();
    dragIds.forEach((dragId) => {
      const item = items.find((i) => i.id === dragId);
      if (item) startPositions.set(dragId, { ...item.position });
    });

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const zoom = useBoardStore.getState().viewport.zoom;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      if (!wasDragging.current && Math.hypot(dx, dy) > 4) {
        wasDragging.current = true;
      }
      if (wasDragging.current) {
        dragIds.forEach((dragId) => {
          const startPos = startPositions.get(dragId)!;
          updateItem(dragId, { position: { x: startPos.x + dx, y: startPos.y + dy } });
        });
      }
    }

    function onUp() {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.releasePointerCapture(e.pointerId);
      if (wasDragging.current) {
        pushUndo({
          description: dragIds.length > 1 ? 'Items moved' : 'Item moved',
          restore: () => {
            startPositions.forEach((pos, dragId) => updateItem(dragId, { position: pos }));
          },
        });
      }
    }

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  }

  return { onPointerDown, wasDragging };
}
