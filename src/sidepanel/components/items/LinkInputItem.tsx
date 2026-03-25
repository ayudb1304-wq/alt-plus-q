import { useEffect, useRef, useState } from 'react';

interface Props {
  x: number;
  y: number;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}

export default function LinkInputItem({ x, y, onConfirm, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function isValidUrl(text: string): boolean {
    try {
      new URL(text.includes('://') ? text : `https://${text}`);
      return true;
    } catch {
      return false;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const trimmed = value.trim();
      if (!trimmed) { onCancel(); return; }
      if (!isValidUrl(trimmed)) {
        setError('Not a valid URL');
        setTimeout(() => setError(''), 1500);
        return;
      }
      const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      onConfirm(url);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 240,
        boxSizing: 'border-box',
        zIndex: 200,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--panel-bg)',
        border: `1px solid ${error ? 'var(--danger)' : 'var(--item-selected-ring)'}`,
        borderRadius: 8,
        padding: '6px 8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'border-color 120ms ease',
      }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>🔗</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onCancel}
          placeholder="Paste or type a URL…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--text-primary)',
            minWidth: 0,
          }}
        />
      </div>
      {error && (
        <div style={{
          marginTop: 4,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--danger)',
          paddingLeft: 4,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
