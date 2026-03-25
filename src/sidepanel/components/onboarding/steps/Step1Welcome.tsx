import { useRef } from 'react';
import Tooltip from '../Tooltip';
import MascotBlob from '../assets/MascotBlob';
import { exitTooltip } from '../animations/gsap';

interface Step1Props {
  onComplete: () => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 6;

/**
 * Step 1 — Welcome.
 * Centered card with static mascot. "Let's go" CTA + "Skip tutorial" link.
 */
export default function Step1Welcome({ onComplete, onSkip }: Step1Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  function handleStart() {
    exitTooltip(tooltipRef.current, onComplete);
  }

  return (
    <Tooltip ref={tooltipRef} target="center">
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <MascotBlob size={64} />
        </div>

        <h2 style={{
          margin: '0 0 6px',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          Welcome to your browser attic
        </h2>
        <p style={{
          margin: '0 0 16px',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          Stash tabs, paste ideas, drag things around. Let's put one useful thing in here.
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === 0 ? 'var(--accent)' : 'var(--toolbar-border)',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleStart}
          style={{
            width: '100%',
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
          }}
        >
          Let's go
        </button>

        <button
          onClick={onSkip}
          style={{
            marginTop: 8,
            border: 'none',
            background: 'none',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'block',
            width: '100%',
          }}
        >
          Skip tutorial
        </button>
      </div>
    </Tooltip>
  );
}
