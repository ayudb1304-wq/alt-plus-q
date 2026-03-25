import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  { action: 'Toggle side panel', key: 'Alt+Q' },
  { action: 'Add content', key: 'Click canvas' },
  { action: 'Select item', key: 'Click item' },
  { action: 'Edit item', key: 'Double-click' },
  { action: 'Exit edit / deselect', key: 'Escape' },
  { action: 'Delete selected', key: 'Delete' },
  { action: 'Duplicate selected', key: 'Ctrl+D' },
  { action: 'Undo', key: 'Ctrl+Z' },
  { action: 'Pan canvas', key: 'Space + drag' },
  { action: 'Recenter view', key: 'Alt+C' },
  { action: 'Reset zoom', key: 'Ctrl+0' },
  { action: 'Multi-select', key: 'Shift+click' },
  { action: 'Bold', key: 'Ctrl+B' },
  { action: 'Italic', key: 'Ctrl+I' },
  { action: 'Inline code', key: 'Ctrl+`' },
];

export default function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'shortcuts-fade-in 120ms ease-out',
      }}
    >
      <style>{`
        @keyframes shortcuts-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shortcuts-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--toolbar-border)',
          borderRadius: 12,
          padding: '20px 24px',
          width: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'shortcuts-slide-in 120ms ease-out',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
        }}>
          Keyboard Shortcuts
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {SHORTCUTS.map(({ action, key }) => (
              <tr key={action}>
                <td style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  padding: '5px 0',
                  paddingRight: 16,
                }}>
                  {action}
                </td>
                <td style={{ textAlign: 'right', padding: '5px 0' }}>
                  <kbd style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    background: 'var(--item-hover-bg)',
                    border: '1px solid var(--toolbar-border)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                  }}>
                    {key}
                  </kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--toolbar-border)',
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Press Escape to close
        </div>
      </div>
    </div>
  );
}
