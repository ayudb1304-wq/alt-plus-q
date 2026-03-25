export interface ToastPayload {
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

type Listener = (payload: ToastPayload | null) => void;

let listener: Listener | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

/** Show a toast. Any previous toast is immediately replaced. */
export function showToast(payload: ToastPayload): void {
  if (dismissTimer) clearTimeout(dismissTimer);
  listener?.(payload);
  dismissTimer = setTimeout(() => {
    listener?.(null);
    dismissTimer = null;
  }, payload.duration ?? 3000);
}

/** Dismiss the current toast immediately. */
export function dismissToast(): void {
  if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; }
  listener?.(null);
}

/** Register the single global toast renderer. Returns an unsubscribe function. */
export function subscribeToast(cb: Listener): () => void {
  listener = cb;
  return () => { if (listener === cb) listener = null; };
}
