import { useEffect, useRef, useState } from 'react';
import Tooltip from '../Tooltip';
import FunnyCopy from '../FunnyCopy';
import { exitTooltip } from '../animations/gsap';
import { on, off } from '../../../lib/events';

interface Step3Props {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Step 3 — Add content via context menu.
 * Centered tooltip telling user to click the canvas.
 * Waits for ITEM_CREATED (not CONTEXT_MENU_OPENED) to avoid race conditions.
 * Shows funny copy near center, then advances.
 */
export default function Step3AddContent({ onComplete, onSkip }: Step3Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const exiting = useRef(false);
  const [funnyPos, setFunnyPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleComplete() {
      if (exiting.current) return;
      exiting.current = true;

      setFunnyPos({
        x: window.innerWidth / 2 - 80,
        y: window.innerHeight / 2 - 20,
      });

      exitTooltip(tooltipRef.current);
    }

    on('ITEM_CREATED', handleComplete);
    return () => { off('ITEM_CREATED', handleComplete); };
  }, [onComplete]);

  return (
    <>
      {!funnyPos && (
        <Tooltip ref={tooltipRef} target="center">
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Click anywhere on the canvas to add text, links, or paste something.
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
          </div>
        </Tooltip>
      )}

      {funnyPos && (
        <FunnyCopy
          text="Look at you, populating the void."
          position={funnyPos}
          onComplete={onComplete}
        />
      )}
    </>
  );
}
