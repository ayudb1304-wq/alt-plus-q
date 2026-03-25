import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import ShortcutsModal from './ShortcutsModal';
import { getFaviconUrl } from '../lib/favicon';
import { findFreePosition } from '../lib/viewport';
import { triggerFlash } from '../lib/flash';
import type { CanvasItem } from '../../types/board';

function isRestrictedUrl(url: string) {
  return url.startsWith('chrome://') || url.startsWith('edge://') || url === '';
}

export default function Toolbar() {
  const addItem = useBoardStore((s) => s.addItem);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Track the active tab
  useEffect(() => {
    function fetchTab() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        setCurrentTab(tabs[0] ?? null);
      });
    }
    fetchTab();

    chrome.tabs.onActivated.addListener(fetchTab);
    chrome.tabs.onUpdated.addListener((_id, change) => {
      if (change.status === 'complete') fetchTab();
    });

    return () => {
      chrome.tabs.onActivated.removeListener(fetchTab);
    };
  }, []);

  // Close more menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const tabUrl = currentTab?.url ?? '';
  const tabDisabled = isRestrictedUrl(tabUrl);

  function handleAddTab() {
    if (tabDisabled || !currentTab) return;
    const id = crypto.randomUUID();
    const item: CanvasItem = {
      id,
      type: 'link',
      position: findFreePosition(useBoardStore.getState().items),
      content: null,
      title: currentTab.title ?? tabUrl,
      url: tabUrl,
      favicon: getFaviconUrl(tabUrl),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addItem(item);
    triggerFlash(id);
  }

  function handleClearBoard() {
    useBoardStore.getState().clearBoard();
    setMoreOpen(false);
  }

  return (<>
    <div
      style={{
        height: 48,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        background: 'var(--toolbar-bg)',
        borderBottom: '1px solid var(--toolbar-border)',
        gap: 8,
        minWidth: 0,
      }}
    >
      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
        }}
      >
        Alt+Q
      </span>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* Add tab button */}
        <button
          onClick={handleAddTab}
          disabled={tabDisabled}
          title={tabDisabled ? 'Cannot add this page' : 'Add current tab to board'}
          style={{
            height: 28,
            padding: '0 10px',
            borderRadius: 6,
            border: 'none',
            background: tabDisabled ? 'var(--item-hover-bg)' : 'var(--accent)',
            color: tabDisabled ? 'var(--text-muted)' : '#000',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 500,
            cursor: tabDisabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add tab
        </button>

        {/* Shortcuts button */}
        <button
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts"
          style={iconButtonStyle}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--item-hover-bg)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          ⌨
        </button>

        {/* More menu */}
        <div ref={moreRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMoreOpen((o) => !o)}
            title="More options"
            style={iconButtonStyle}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--item-hover-bg)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            ⋯
          </button>

          {moreOpen && (
            <div
              style={{
                position: 'absolute',
                top: 32,
                right: 0,
                background: 'var(--panel-bg)',
                border: '1px solid var(--toolbar-border)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: 160,
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Export', action: () => setMoreOpen(false) },
                { label: 'Clear board', action: handleClearBoard },
                { label: 'About', action: () => setMoreOpen(false) },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={menuItemStyle}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'var(--item-hover-bg)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = 'transparent')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
  </>);
}

const iconButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 14px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--text-primary)',
  cursor: 'pointer',
};
