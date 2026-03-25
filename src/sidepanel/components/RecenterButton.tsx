import { useBoardStore } from '../store/boardStore';

const ITEM_W = 200;
const ITEM_H = 80;
const PADDING = 40;

export default function RecenterButton({
  outerRef,
  canvasRef,
}: {
  outerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const items = useBoardStore((s) => s.items);
  const setViewport = useBoardStore((s) => s.setViewport);

  if (items.length === 0) return null;

  function handleRecenter() {
    const outer = outerRef.current;
    const canvas = canvasRef.current;
    if (!outer || !canvas) return;

    const W = outer.clientWidth;
    const H = outer.clientHeight;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const item of items) {
      minX = Math.min(minX, item.position.x);
      minY = Math.min(minY, item.position.y);
      maxX = Math.max(maxX, item.position.x + ITEM_W);
      maxY = Math.max(maxY, item.position.y + ITEM_H);
    }

    const contentW = maxX - minX + PADDING * 2;
    const contentH = maxY - minY + PADDING * 2;
    const newZoom = Math.min(Math.min(W / contentW, H / contentH), 1.0);
    const clampedZoom = Math.max(Math.min(newZoom, 4.0), 0.25);

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;
    const newX = W / 2 - centerX * clampedZoom;
    const newY = H / 2 - centerY * clampedZoom;

    // Animate via CSS transition
    canvas.style.transition = 'transform 250ms ease-in-out';
    canvas.addEventListener(
      'transitionend',
      () => { canvas.style.transition = ''; },
      { once: true }
    );

    setViewport({ x: newX, y: newY, zoom: clampedZoom });
  }

  return (
    <button
      onClick={handleRecenter}
      title="Recenter view"
      style={{
        position: 'absolute',
        bottom: 48,
        right: 12,
        height: 28,
        padding: '0 10px',
        borderRadius: 6,
        border: '1px solid var(--toolbar-border)',
        background: 'var(--panel-bg)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      ⌖ Recenter
    </button>
  );
}
