export interface UndoEntry {
  description: string;
  restore: () => void;
}

const stack: UndoEntry[] = [];
const MAX_STACK = 20;

type PushListener = (entry: UndoEntry) => void;
const listeners = new Set<PushListener>();

/** Push an undo entry. Oldest entry is dropped once stack exceeds MAX_STACK. */
export function pushUndo(entry: UndoEntry): void {
  stack.push(entry);
  if (stack.length > MAX_STACK) stack.shift();
  listeners.forEach((l) => l(entry));
}

/** Pop and return the most recent undo entry, or undefined if the stack is empty. */
export function popUndo(): UndoEntry | undefined {
  return stack.pop();
}

/**
 * Subscribe to undo pushes. The callback receives the newly pushed entry.
 * Returns an unsubscribe function.
 */
export function subscribeUndo(cb: PushListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
