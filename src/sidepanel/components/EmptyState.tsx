import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useOnboardingStore } from '../store/onboardingStore';

export default function EmptyState() {
  const items = useBoardStore((s) => s.items);
  const onboardingDismissed = useOnboardingStore((s) => s.dismissed);
  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const [visible, setVisible] = useState(true);
  const hasEverHadItems = useRef(false);
  const prevItemCount = useRef(0);

  useEffect(() => {
    const count = items.length;

    // clearBoard: items dropped to 0 from > 0 → show again
    if (prevItemCount.current > 0 && count === 0) {
      hasEverHadItems.current = false;
      setVisible(true);
    }

    // First item added → fade out and never show again until clearBoard
    if (!hasEverHadItems.current && count > 0) {
      hasEverHadItems.current = true;
      setVisible(false);
    }

    prevItemCount.current = count;
  }, [items]);

  // Onboarding IS the empty-state teacher — hide until tutorial is done or skipped
  if (onboardingHydrated && !onboardingDismissed) return null;

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes empty-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'empty-fade-in 300ms ease',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          margin: '0 0 8px 0',
          textAlign: 'center',
        }}>
          Your board is empty.
        </p>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--text-muted)',
          margin: '0 0 20px 0',
          textAlign: 'center',
        }}>
          Click anywhere to start, or add your current tab.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Click anywhere', 'Paste a link', 'Alt+Q'].map((label) => (
            <span
              key={label}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 20,
                padding: '4px 12px',
                opacity: 0.7,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
