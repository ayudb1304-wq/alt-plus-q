import { useEffect, useRef, useState } from 'react';
import { showToast } from '../lib/toast';

interface ContextMenuProps {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  onText: (x: number, y: number) => void;
  onLink: (x: number, y: number) => void;
  onPaste: (x: number, y: number, text: string) => void;
  onClose: () => void;
}

export default function ContextMenu({
  screenX,
  screenY,
  canvasX,
  canvasY,
  onText,
  onLink,
  onPaste,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [clipboardText, setClipboardText] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: screenX, y: screenY });

  // Read clipboard on open
  useEffect(() => {
    navigator.clipboard.readText().then(
      (text) => setClipboardText(text || null),
      () => {
        setClipboardText(null);
        showToast({ message: 'Clipboard access denied', duration: 2500 });
      }
    );
  }, []);

  // Adjust position to stay within panel bounds
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    let x = screenX;
    let y = screenY;
    if (x + rect.width > vpW - 8) x = vpW - rect.width - 8;
    if (y + rect.height > vpH - 8) y = vpH - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    setPos({ x, y });
  }, [screenX, screenY]);

  // Dismiss on Escape, outside click, or side panel losing focus (user clicked webpage)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    }
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onBlur() {
      onClose();
    }
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('blur', onBlur);
    };
  }, [onClose]);

  const pasteEnabled = !!clipboardText;

  return (
    <>
      <style>{`
        @keyframes context-menu-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .context-menu {
          animation: context-menu-in 80ms ease-out forwards;
        }
        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 12px;
          border: none;
          background: transparent;
          text-align: left;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 4px;
        }
        .context-menu-item:hover:not(:disabled) {
          background: var(--item-hover-bg);
        }
        .context-menu-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          background: 'var(--panel-bg)',
          border: '1px solid var(--toolbar-border)',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
          padding: 4,
          minWidth: 160,
          maxWidth: 180,
          zIndex: 1000,
          transformOrigin: 'top left',
        }}
      >
        <button
          className="context-menu-item"
          onClick={() => { onText(canvasX, canvasY); onClose(); }}
        >
          <span style={{ fontWeight: 600, width: 16 }}>T</span> Text
        </button>
        <button
          className="context-menu-item"
          onClick={() => { onLink(canvasX, canvasY); onClose(); }}
        >
          <span style={{ width: 16 }}>🔗</span> Link
        </button>
        <button
          className="context-menu-item"
          disabled={!pasteEnabled}
          onClick={() => {
            if (clipboardText) { onPaste(canvasX, canvasY, clipboardText); onClose(); }
          }}
        >
          <span style={{ width: 16 }}>📋</span> Paste
        </button>
      </div>
    </>
  );
}
