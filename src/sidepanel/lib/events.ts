/** Minimal onboarding event bus. */

export type OnboardingEvent =
  | 'ADD_TAB_CLICKED'
  | 'ITEM_CREATED'
  | 'ITEM_MOVED';

const listeners = new Map<OnboardingEvent, Set<() => void>>();

export function emit(event: OnboardingEvent): void {
  listeners.get(event)?.forEach((fn) => fn());
}

export function on(event: OnboardingEvent, fn: () => void): void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
}

export function off(event: OnboardingEvent, fn: () => void): void {
  listeners.get(event)?.delete(fn);
}
