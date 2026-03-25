import type { BoardState } from '../../types/board';

export const STORAGE_KEY = 'altq_board_v1';

export const DEFAULT_BOARD_STATE: BoardState = {
  items: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  version: 1,
};

export async function getBoardState(): Promise<BoardState> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  if (!stored) return { ...DEFAULT_BOARD_STATE };
  return stored as BoardState;
}

export async function setBoardState(state: BoardState): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch (err) {
    console.warn('[Alt+Q] Storage write failed:', err);
  }
}

export async function clearBoardState(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
