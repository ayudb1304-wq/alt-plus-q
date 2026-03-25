/** Module-level flash registry — no Zustand needed, avoids re-rendering unrelated items. */

const flashingSet = new Set<string>();
const listeners = new Set<(id: string) => void>();

export function triggerFlash(id: string, duration = 1400) {
  flashingSet.add(id);
  listeners.forEach((l) => l(id));
  setTimeout(() => {
    flashingSet.delete(id);
    listeners.forEach((l) => l(id));
  }, duration);
}

export function isFlashing(id: string): boolean {
  return flashingSet.has(id);
}

/** Subscribe to flash events for a specific item id. Returns unsubscribe fn. */
export function subscribeFlash(id: string, cb: (flashing: boolean) => void): () => void {
  function handler(flashedId: string) {
    if (flashedId === id) cb(flashingSet.has(id));
  }
  listeners.add(handler);
  return () => listeners.delete(handler);
}
