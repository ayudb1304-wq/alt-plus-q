import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useCanvasZoom(outerRef: React.RefObject<HTMLDivElement | null>) {
  const setViewport = useBoardStore((s) => s.setViewport);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const vp = useBoardStore.getState().viewport;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = clamp(vp.zoom * zoomFactor, 0.25, 4.0);
      const ratio = newZoom / vp.zoom;
      const newX = e.clientX - ratio * (e.clientX - vp.x);
      const newY = e.clientY - ratio * (e.clientY - vp.y);

      setViewport({ x: newX, y: newY, zoom: newZoom });
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [outerRef, setViewport]);
}
