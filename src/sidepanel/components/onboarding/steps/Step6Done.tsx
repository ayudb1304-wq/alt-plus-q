import { useRef } from 'react';
import Tooltip from '../Tooltip';
import MascotBlob from '../assets/MascotBlob';
import { exitTooltip } from '../animations/gsap';

interface Step6Props {
  onComplete: () => void;
}

const TOTAL_STEPS = 6;

/**
 * Step 6 — Done.
 * Centered card with static mascot, all progress dots filled.
 * "Done" CTA dismisses onboarding permanently.
 */
export default function Step6Done({ onComplete }: Step6Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  function handleDone() {
    exitTooltip(tooltipRef.current, onComplete);
  }

  return (
    <Tooltip ref={tooltipRef} target="center">
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <MascotBlob size={56} />
        </div>

        <h2 style={{
          margin: '0 0 6px',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          You're all set
        </h2>
        <p style={{
          margin: '0 0 16px',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          Your attic is open for business. Stash anything, organize everything.
        </p>

        {/* All dots filled */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleDone}
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
          Done
        </button>
      </div>
    </Tooltip>
  );
}
