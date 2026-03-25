import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';

export function useCanvasPan(outerRef: React.RefObject<HTMLDivElement | null>) {
  const setViewport = useBoardStore((s) => s.setViewport);
  const spaceHeld = useRef(false);
  const isDragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startViewport = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !e.repeat) {
        // Don't intercept space when user is typing in a text editor
        const active = document.activeElement;
        if (active?.getAttribute('contenteditable') === 'true') return;
        spaceHeld.current = true;
        el!.style.cursor = 'grab';
        e.preventDefault();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        spaceHeld.current = false;
        if (!isDragging.current) el!.style.cursor = '';
      }
    }

    function isBackground(target: EventTarget | null) {
      return (
        spaceHeld.current ||
        target === el ||
        (target instanceof HTMLElement && target.dataset.canvasBg === 'true')
      );
    }

    function onPointerDown(e: PointerEvent) {
      if (!isBackground(e.target)) return;
      isDragging.current = true;
      startPointer.current = { x: e.clientX, y: e.clientY };
      const vp = useBoardStore.getState().viewport;
      startViewport.current = { x: vp.x, y: vp.y };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      el!.style.cursor = 'grabbing';
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return;
      const dx = e.clientX - startPointer.current.x;
      const dy = e.clientY - startPointer.current.y;
      const vp = useBoardStore.getState().viewport;
      setViewport({
        ...vp,
        x: startViewport.current.x + dx,
        y: startViewport.current.y + dy,
      });
    }

    function onPointerUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      el!.style.cursor = spaceHeld.current ? 'grab' : '';
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [outerRef, setViewport]);

  return { spaceHeld };
}
