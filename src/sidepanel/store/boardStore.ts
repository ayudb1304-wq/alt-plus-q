import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CanvasItem, ViewportState } from '../../types/board';
import { getBoardState, setBoardState } from '../lib/storage';
import { isEditorEmpty } from '../lib/tiptap';
import { findFreePosition } from '../lib/placement';
import { pushUndo } from '../lib/undo';
import { emit } from '../lib/events';

interface BoardStore {
  items: CanvasItem[];
  viewport: ViewportState;
  isHydrated: boolean;
  pendingFlashIds: string[];
  selectedIds: Set<string>;

  hydrate: () => Promise<void>;
  addItem: (item: CanvasItem) => void;
  updateItem: (id: string, patch: Partial<CanvasItem>) => void;
  deleteItem: (id: string) => void;
  deleteItems: (ids: string[]) => void;
  setViewport: (viewport: ViewportState) => void;
  clearBoard: () => void;
  setSelectedIds: (ids: Set<string>) => void;
}

export const useBoardStore = create<BoardStore>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    isHydrated: false,
    pendingFlashIds: [],
    selectedIds: new Set<string>(),

    hydrate: async () => {
      const state = await getBoardState();
      const panelW = window.innerWidth;
      const panelH = window.innerHeight - 48;

      const pendingFlashIds: string[] = [];

      const filtered = state.items.filter(
        (item) => !(item.type === 'text' && isEditorEmpty(item.content))
      );

      const isSentinel = (item: CanvasItem) =>
        item.position.x === -99999 && item.position.y === -99999;

      const placed = filtered.filter((item) => !isSentinel(item));
      const sentinels = filtered.filter(isSentinel);

      const accumulated = [...placed];
      const repositioned = sentinels.map((item) => {
        const position = findFreePosition(state.viewport, panelW, panelH, accumulated);
        const positioned = { ...item, position };
        accumulated.push(positioned);
        pendingFlashIds.push(positioned.id);
        return positioned;
      });

      const items = [...placed, ...repositioned];
      console.log('[Alt+Q] hydrated, isHydrated → true', state);
      set({ items, viewport: state.viewport, isHydrated: true, pendingFlashIds });
    },

    addItem: (item) => {
      set((s) => ({ items: [item, ...s.items] }));
      emit('ITEM_CREATED');
    },

    updateItem: (id, patch) => {
      set((s) => ({
        items: s.items.map((item) =>
          item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item
        ),
      }));
    },

    deleteItem: (id) => {
      const snapshot = get().items.find((item) => item.id === id);
      set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
      if (snapshot) {
        pushUndo({
          description: 'Item deleted',
          restore: () => set((s) => ({ items: [snapshot, ...s.items] })),
        });
      }
    },

    deleteItems: (ids) => {
      const idSet = new Set(ids);
      const snapshots = get().items.filter((item) => idSet.has(item.id));
      set((s) => ({
        items: s.items.filter((item) => !idSet.has(item.id)),
        selectedIds: new Set(),
      }));
      if (snapshots.length > 0) {
        pushUndo({
          description: snapshots.length === 1 ? 'Item deleted' : `${snapshots.length} items deleted`,
          restore: () => set((s) => ({ items: [...snapshots, ...s.items] })),
        });
      }
    },

    setViewport: (viewport) => {
      set({ viewport });
    },

    setSelectedIds: (ids) => {
      set({ selectedIds: ids });
    },

    clearBoard: () => {
      const snapshot = get().items;
      set({ items: [], selectedIds: new Set() });
      setBoardState({ items: [], viewport: get().viewport, version: 1 });
      if (snapshot.length > 0) {
        pushUndo({
          description: 'Board cleared',
          restore: () => set({ items: snapshot }),
        });
      }
    },
  }))
);

// Expose store on window for DevTools console testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__boardStore = useBoardStore;
}
