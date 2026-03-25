import { useEffect, useRef, useState } from 'react';
import Tooltip from '../Tooltip';
import FunnyCopy from '../FunnyCopy';
import { exitTooltip } from '../animations/gsap';
import { on, off } from '../../../lib/events';

interface Step4Props {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Step 4 — Drag to organize.
 * Centered tooltip instructing user to drag any item.
 * Waits for ITEM_MOVED (>=40px screen distance), shows funny copy, then advances.
 */
export default function Step4DragItem({ onComplete, onSkip }: Step4Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const exiting = useRef(false);
  const [funnyPos, setFunnyPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleComplete() {
      if (exiting.current) return;
      exiting.current = true;

      setFunnyPos({
        x: window.innerWidth / 2 - 60,
        y: window.innerHeight / 2,
      });

      exitTooltip(tooltipRef.current);
    }

    on('ITEM_MOVED', handleComplete);
    return () => { off('ITEM_MOVED', handleComplete); };
  }, [onComplete]);

  return (
    <>
      {!funnyPos && (
        <Tooltip ref={tooltipRef} target="center">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Grab any card and drag it somewhere. Your board, your rules.
          </p>
          <button
            onClick={onSkip}
            style={{
              marginTop: 8,
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: 0,
            }}
          >
            Skip tutorial
          </button>
        </Tooltip>
      )}

      {funnyPos && (
        <FunnyCopy
          text="Spatial thinker. We see you."
          position={funnyPos}
          onComplete={onComplete}
        />
      )}
    </>
  );
}
