import { getBoardState, setBoardState, DEFAULT_BOARD_STATE } from '../sidepanel/lib/storage';
import type { CanvasItem } from '../types/board';

console.log('SW ready');

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async () => {
  // Side panel opens/closes on toolbar icon click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Register context menu items (persists across SW restarts)
  chrome.contextMenus.create({
    id: 'send-tab',
    title: 'Send tab to Alt+Q Board',
    contexts: ['action'],
  });

  chrome.contextMenus.create({
    id: 'send-selection',
    title: 'Send selection to Alt+Q Board',
    contexts: ['selection'],
  });

  // Initialize storage with default state if empty
  const state = await getBoardState();
  if (state.items.length === 0) {
    await setBoardState(DEFAULT_BOARD_STATE);
  }
});

// ---------------------------------------------------------------------------
// Context menu clicks
// ---------------------------------------------------------------------------

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send-tab') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    console.log('[Alt+Q] send-tab clicked, activeTab:', activeTab);
    if (!activeTab) return;

    const url = activeTab.url ?? '';
    if (url.startsWith('chrome://') || url.startsWith('edge://')) return;

    const item = buildLinkItem(activeTab.title ?? url, url);
    await prependItem(item);
    console.log('[Alt+Q] link item added:', item);
  }

  if (info.menuItemId === 'send-selection') {
    const url = tab?.url ?? '';
    const selectionText = info.selectionText ?? '';
    if (!selectionText) return;

    const item = buildSnippetItem(selectionText, url);
    await prependItem(item);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildLinkItem(title: string, url: string): CanvasItem {
  return {
    id: crypto.randomUUID(),
    type: 'link',
    position: { x: 40, y: 40 },
    content: null,
    title,
    url,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function buildSnippetItem(text: string, sourceUrl: string): CanvasItem {
  return {
    id: crypto.randomUUID(),
    type: 'snippet',
    position: { x: 40, y: 40 },
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    },
    sourceUrl,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

async function prependItem(newItem: CanvasItem): Promise<void> {
  const state = await getBoardState();
  // Sentinel position — panel will reposition to viewport center on open/hydrate
  newItem.position = { x: -99999, y: -99999 };
  await setBoardState({ ...state, items: [newItem, ...state.items] });
}
