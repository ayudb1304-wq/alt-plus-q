import { useEffect, useRef, useState } from 'react';
import Tooltip from '../Tooltip';
import SpotlightRing from '../SpotlightRing';
import FunnyCopy from '../FunnyCopy';
import { exitTooltip } from '../animations/gsap';
import { on, off } from '../../../lib/events';

interface Step2Props {
  onComplete: () => void;
  onSkip: () => void;
}

const TARGET = '[data-onboarding-target="add-tab"]';

/**
 * Step 2 — Save this tab.
 * Tooltip anchored to the "+ Add tab" button with a spotlight ring.
 * Completes on ADD_TAB_CLICKED, shows funny copy, then advances.
 */
export default function Step2SaveTab({ onComplete, onSkip }: Step2Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const exiting = useRef(false);
  const [funnyPos, setFunnyPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleComplete() {
      if (exiting.current) return;
      exiting.current = true;

      // Position funny copy near the button
      const btn = document.querySelector<HTMLElement>(TARGET);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setFunnyPos({ x: rect.left, y: rect.bottom + 12 });
      }

      // Hide the tooltip immediately
      exitTooltip(tooltipRef.current);
    }

    on('ADD_TAB_CLICKED', handleComplete);
    return () => { off('ADD_TAB_CLICKED', handleComplete); };
  }, [onComplete]);

  return (
    <>
      <SpotlightRing target={TARGET} padding={5} borderRadius={8} />

      {!funnyPos && (
        <Tooltip ref={tooltipRef} target={TARGET} placement="below">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Hit <strong style={{ color: 'var(--text-primary)' }}>+ Add tab</strong> to save this page to your board.
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
          text="Your wild tab has been captured."
          position={funnyPos}
          onComplete={onComplete}
        />
      )}
    </>
  );
}
