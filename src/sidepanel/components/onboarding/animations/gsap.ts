/**
 * GSAP helpers for onboarding tooltip choreography.
 * Handles: tooltip/card enter/exit, funny-copy fade in/out.
 */

import gsap from 'gsap';

/** Fade + scale in a tooltip or card. */
export function enterTooltip(el: HTMLElement | null): gsap.core.Timeline {
  const tl = gsap.timeline();
  if (!el) return tl;
  tl.fromTo(
    el,
    { opacity: 0, scale: 0.95, y: 4 },
    { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
  );
  return tl;
}

/** Fade + scale out a tooltip or card, then call onComplete. */
export function exitTooltip(
  el: HTMLElement | null,
  onComplete?: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete });
  if (!el) { onComplete?.(); return tl; }
  tl.to(el, { opacity: 0, scale: 0.96, y: 4, duration: 0.18, ease: 'power2.in' });
  return tl;
}

/** Fade in funny copy with a slight bounce. */
export function showFunnyCopy(el: HTMLElement | null): gsap.core.Timeline {
  const tl = gsap.timeline();
  if (!el) return tl;
  tl.fromTo(
    el,
    { opacity: 0, y: -8, scale: 0.92 },
    { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.4)' }
  );
  return tl;
}

/** Fade out funny copy. */
export function hideFunnyCopy(
  el: HTMLElement | null,
  onComplete?: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete });
  if (!el) { onComplete?.(); return tl; }
  tl.to(el, { opacity: 0, y: -4, duration: 0.25, ease: 'power2.in' });
  return tl;
}
