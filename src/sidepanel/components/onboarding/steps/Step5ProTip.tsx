import { useRef } from 'react';
import Tooltip from '../Tooltip';
import { exitTooltip } from '../animations/gsap';

interface Step5Props {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Step 5 — Pro tip: text selection.
 * Informational step (not interactive). Centered tooltip with a text-selection
 * SVG icon explaining how to add text from webpages. "Got it" button advances.
 */
export default function Step5ProTip({ onComplete, onSkip }: Step5Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  function handleGotIt() {
    exitTooltip(tooltipRef.current, onComplete);
  }

  return (
    <Tooltip ref={tooltipRef} target="center">
      <div style={{ textAlign: 'center' }}>
        {/* Text selection icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <svg
            viewBox="0 0 40 40"
            width="36"
            height="36"
            fill="none"
            aria-hidden="true"
          >
            {/* Text lines */}
            <line x1="6" y1="10" x2="34" y2="10" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="18" x2="28" y2="18" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="26" x2="22" y2="26" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            {/* Selection highlight */}
            <rect x="6" y="14" width="22" height="8" rx="2" fill="var(--accent)" fillOpacity="0.2" />
            {/* Cursor */}
            <path
              d="M 30 22 L 30 34 L 33.5 30 L 37 34"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <p style={{
          margin: '0 0 4px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Pro tip
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Select any text on a webpage, right-click, and choose{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Add to Alt+Q</strong> —
          or just hit <strong style={{ color: 'var(--text-primary)' }}>Alt+Q</strong> with text selected.
        </p>

        <button
          onClick={handleGotIt}
          style={{
            width: '100%',
            height: 34,
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>

        <button
          onClick={onSkip}
          style={{
            marginTop: 6,
            border: 'none',
            background: 'none',
            color: 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'block',
            width: '100%',
            padding: 0,
          }}
        >
          Skip tutorial
        </button>
      </div>
    </Tooltip>
  );
}
