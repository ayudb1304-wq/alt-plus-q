import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { setBoardState, STORAGE_KEY } from '../lib/storage';
import { findFreePosition } from '../lib/viewport';
import { triggerFlash } from '../lib/flash';
import type { CanvasItem, BoardState } from '../../types/board';

export function useStorageSync() {
  useEffect(() => {
    // Track known IDs to detect externally-added items
    const knownIds = new Set(useBoardStore.getState().items.map((i) => i.id));

    const unsubIds = useBoardStore.subscribe(
      (s) => s.items,
      (items) => {
        knownIds.clear();
        items.forEach((i) => knownIds.add(i.id));
      }
    );

    // Debounced write to storage
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubWrite = useBoardStore.subscribe(
      (state) => ({ items: state.items, viewport: state.viewport }),
      ({ items, viewport }) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setBoardState({ items, viewport, version: 1 });
        }, 300);
      },
      { equalityFn: (a, b) => a.items === b.items && a.viewport === b.viewport }
    );

    // Listen for items added from outside (background service worker)
    function onStorageChanged(
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      const newState = changes[STORAGE_KEY].newValue as BoardState | undefined;
      if (!newState?.items) return;

      const externalItems = newState.items.filter((i: CanvasItem) => !knownIds.has(i.id));
      if (externalItems.length === 0) return;

      const accumulated = [...useBoardStore.getState().items];
      externalItems.forEach((item: CanvasItem) => {
        const positioned: CanvasItem = {
          ...item,
          position: findFreePosition(accumulated),
        };
        accumulated.push(positioned);
        useBoardStore.getState().addItem(positioned);
        triggerFlash(positioned.id);
      });
    }

    chrome.storage.onChanged.addListener(onStorageChanged);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubIds();
      unsubWrite();
      chrome.storage.onChanged.removeListener(onStorageChanged);
    };
  }, []);
}
