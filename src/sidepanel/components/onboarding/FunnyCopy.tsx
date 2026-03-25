import { useEffect, useRef } from 'react';
import { showFunnyCopy, hideFunnyCopy } from './animations/gsap';

interface FunnyCopyProps {
  text: string;
  /** Screen coordinates to show the copy near */
  position: { x: number; y: number };
  onComplete: () => void;
  /** Delay before showing (ms) */
  delay?: number;
  /** How long to stay visible (ms) */
  duration?: number;
}

/**
 * Contextual funny copy that appears near an action,
 * stays briefly, then fades out and calls onComplete.
 */
export default function FunnyCopy({
  text,
  position,
  onComplete,
  delay = 200,
  duration = 1500,
}: FunnyCopyProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let hideTimer: ReturnType<typeof setTimeout>;

    const showTimer = setTimeout(() => {
      const tl = showFunnyCopy(el);
      hideTimer = setTimeout(() => {
        hideFunnyCopy(el, onComplete);
      }, duration);

      return () => tl.kill();
    }, delay);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [delay, duration, onComplete]);

  // Clamp position to stay within viewport
  const vw = window.innerWidth;
  const left = Math.max(12, Math.min(position.x, vw - 220));
  const top = Math.max(12, position.y);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 61,
        pointerEvents: 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--accent)',
        background: 'var(--panel-bg)',
        border: '1.5px solid var(--accent)',
        borderRadius: 10,
        padding: '6px 12px',
        boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
        whiteSpace: 'nowrap',
        opacity: 0,
      }}
    >
      {text}
    </div>
  );
}
