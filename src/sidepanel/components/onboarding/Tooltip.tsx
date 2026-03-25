import { useEffect, useRef, useState, forwardRef } from 'react';
import { enterTooltip } from './animations/gsap';

type Placement = 'below' | 'above' | 'left' | 'right';

interface TooltipProps {
  /** CSS selector for the target element, or "center" for centered placement */
  target: string | 'center';
  /** Preferred placement relative to target */
  placement?: Placement;
  /** Extra gap between tooltip and target (px) */
  gap?: number;
  children: React.ReactNode;
}

/**
 * Anchored tooltip for onboarding coach marks.
 * Dynamically positions itself near the target element and
 * repositions on resize via ResizeObserver.
 */
const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ target, placement = 'below', gap = 10, children }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = (ref as React.RefObject<HTMLDivElement>) || innerRef;
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      function reposition() {
        if (!tooltip) return;

        if (target === 'center') {
          setStyle({
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
          });
          return;
        }

        const el = document.querySelector<HTMLElement>(target);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top = 0;
        let left = 0;
        let chosen = placement;

        // Try preferred placement, fall back if not enough space
        if (placement === 'below' && rect.bottom + gap + th > vh) chosen = 'above';
        if (placement === 'above' && rect.top - gap - th < 0) chosen = 'below';
        if (placement === 'left' && rect.left - gap - tw < 0) chosen = 'right';
        if (placement === 'right' && rect.right + gap + tw > vw) chosen = 'left';

        switch (chosen) {
          case 'below':
            top = rect.bottom + gap;
            left = rect.left + rect.width / 2 - tw / 2;
            break;
          case 'above':
            top = rect.top - gap - th;
            left = rect.left + rect.width / 2 - tw / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - th / 2;
            left = rect.left - gap - tw;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - th / 2;
            left = rect.right + gap;
            break;
        }

        // Clamp to viewport
        left = Math.max(8, Math.min(left, vw - tw - 8));
        top = Math.max(8, Math.min(top, vh - th - 8));

        setStyle({
          position: 'fixed',
          top,
          left,
          zIndex: 60,
        });

        // Position the arrow
        const arrowSize = 6;
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;

        switch (chosen) {
          case 'below':
            setArrowStyle({
              position: 'absolute',
              top: -arrowSize,
              left: Math.max(12, Math.min(targetCenterX - left, tw - 12)),
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid transparent`,
              borderBottom: `${arrowSize}px solid var(--panel-bg)`,
            });
            break;
          case 'above':
            setArrowStyle({
              position: 'absolute',
              bottom: -arrowSize,
              left: Math.max(12, Math.min(targetCenterX - left, tw - 12)),
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid transparent`,
              borderTop: `${arrowSize}px solid var(--panel-bg)`,
            });
            break;
          case 'left':
            setArrowStyle({
              position: 'absolute',
              right: -arrowSize,
              top: Math.max(12, Math.min(targetCenterY - top, th - 12)),
              transform: 'translateY(-50%)',
              width: 0, height: 0,
              borderTop: `${arrowSize}px solid transparent`,
              borderBottom: `${arrowSize}px solid transparent`,
              borderLeft: `${arrowSize}px solid var(--panel-bg)`,
            });
            break;
          case 'right':
            setArrowStyle({
              position: 'absolute',
              left: -arrowSize,
              top: Math.max(12, Math.min(targetCenterY - top, th - 12)),
              transform: 'translateY(-50%)',
              width: 0, height: 0,
              borderTop: `${arrowSize}px solid transparent`,
              borderBottom: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid var(--panel-bg)`,
            });
            break;
        }
      }

      // Initial position + animate in
      reposition();
      const tl = enterTooltip(tooltip);

      // Reposition on resize
      const observer = new ResizeObserver(reposition);
      observer.observe(document.body);
      window.addEventListener('resize', reposition);

      return () => {
        tl.kill();
        observer.disconnect();
        window.removeEventListener('resize', reposition);
      };
    }, [target, placement, gap]);

    return (
      <div
        ref={tooltipRef}
        style={{
          ...style,
          background: 'var(--panel-bg)',
          border: '1px solid var(--toolbar-border)',
          borderRadius: 12,
          padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-sans)',
          maxWidth: 280,
          minWidth: 200,
        }}
      >
        {target !== 'center' && <div style={arrowStyle} />}
        {children}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';
export default Tooltip;
