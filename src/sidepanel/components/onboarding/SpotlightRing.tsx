import { useEffect, useRef, useState } from 'react';

interface SpotlightRingProps {
  /** CSS selector for the element to spotlight */
  target: string;
  /** Extra padding around the target rect (px) */
  padding?: number;
  /** Border radius override */
  borderRadius?: number;
}

/**
 * Pulsing amber ring over a target DOM element.
 * Uses ResizeObserver to track position changes.
 * CSS animation for the pulse (no GSAP needed for infinite loops).
 * pointer-events: none so clicks pass through.
 */
export default function SpotlightRing({
  target,
  padding = 6,
  borderRadius,
}: SpotlightRingProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;

    function update() {
      const el = document.querySelector<HTMLElement>(target);
      if (el) setRect(el.getBoundingClientRect());
    }

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(document.body);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [target]);

  if (!rect) return null;

  const computedRadius = borderRadius ?? 8;

  return (
    <>
      <style>{`
        @keyframes spotlight-pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(245,158,11,0.25);
            transform: scale(1.03);
          }
        }
      `}</style>
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          border: '2px solid var(--accent)',
          borderRadius: computedRadius + padding,
          pointerEvents: 'none',
          zIndex: 55,
          animation: 'spotlight-pulse 1.2s ease-in-out infinite',
        }}
      />
    </>
  );
}
