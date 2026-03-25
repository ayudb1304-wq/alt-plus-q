import { useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useDrag } from '../../hooks/useDrag';
import { getFaviconUrl, getHostname, FALLBACK_SVG } from '../../lib/favicon';
import { subscribeFlash, isFlashing } from '../../lib/flash';
import type { CanvasItem } from '../../../types/board';
import React from 'react';

const DEFAULT_WIDTH = 240;

interface Props {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: () => void;
  onShiftSelect: () => void;
  onDuplicate: () => void;
}

export default function LinkItem({ item, isSelected, onSelect, onShiftSelect, onDuplicate }: Props) {
  const deleteItem = useBoardStore((s) => s.deleteItem);
  const [hovered, setHovered] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [flashing, setFlashing] = useState(() => isFlashing(item.id));
  const [copied, setCopied] = useState(false);
  const { onPointerDown, wasDragging } = useDrag(item.id);
  const itemWidth = item.width ?? DEFAULT_WIDTH;
  const hostname = getHostname(item.url ?? '');
  const faviconSrc = faviconError ? FALLBACK_SVG : getFaviconUrl(item.url ?? '');
  const showBg = hovered || isSelected;

  useEffect(() => subscribeFlash(item.id, setFlashing), [item.id]);

  function handlePointerUp(e: React.PointerEvent) {
    if (e.shiftKey) { onShiftSelect(); return; }
    if (wasDragging.current) return;
    onSelect();
  }

  function openUrl() {
    if (item.url) chrome.tabs.create({ url: item.url });
  }

  return (
    <div
      onPointerDown={(e) => { if (e.shiftKey) { e.stopPropagation(); return; } onPointerDown(e); }}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: item.position.x,
        top: item.position.y,
        width: itemWidth,
        padding: showBg ? 8 : 0,
        borderRadius: 8,
        background: showBg ? 'var(--item-hover-bg)' : 'transparent',
        boxShadow: isSelected
          ? '0 0 0 2px var(--item-selected-ring)'
          : flashing
          ? '0 0 0 2px var(--item-selected-ring)'
          : 'none',
        animation: flashing ? 'item-breathe 1.4s ease-out forwards' : 'none',
        transition: 'background 120ms ease, padding 120ms ease',
        cursor: 'grab',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      {/* Bubble: Open + trash */}
      {isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--panel-bg)',
            border: '1px solid var(--toolbar-border)',
            borderRadius: 6,
            padding: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); openUrl(); }}
            style={bubbleBtn()}
            title="Open link"
          >
            Open ↗
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(item.url ?? '').then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 800);
              });
            }}
            style={{ ...bubbleBtn(), color: copied ? '#22c55e' : 'var(--text-secondary)', transition: 'color 150ms ease' }}
            title="Copy URL"
          >
            <CopyIcon />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }}
            style={bubbleBtn()}
            title="Duplicate item"
          >
            <DuplicateIcon />
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--toolbar-border)', margin: '0 2px' }} />
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteItem(item.id); }}
            style={{ ...bubbleBtn(), color: 'var(--danger)' }}
            title="Delete item"
          >
            <TrashIcon />
          </button>
        </div>
      )}

      {/* Link card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <img
          src={faviconSrc}
          width={16}
          height={16}
          style={{ flexShrink: 0, borderRadius: 2 }}
          onError={() => setFaviconError(true)}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--accent)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.title || hostname}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: 1,
          }}>
            {hostname}
          </div>
        </div>
        {/* ↗ arrow on hover */}
        <div style={{
          flexShrink: 0,
          color: 'var(--text-muted)',
          fontSize: 13,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 120ms ease',
        }}>
          ↗
        </div>
      </div>

      {/* Full URL tooltip */}
      {hovered && item.url && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          background: 'var(--panel-bg)',
          border: '1px solid var(--toolbar-border)',
          borderRadius: 4,
          padding: '3px 6px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          maxWidth: 280,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          zIndex: 50,
          pointerEvents: 'none',
        }}>
          {item.url}
        </div>
      )}
    </div>
  );
}

function bubbleBtn(): React.CSSProperties {
  return {
    height: 26,
    padding: '0 8px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };
}

function DuplicateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 3V2.5A1.5 1.5 0 0 1 5.5 1h5A1.5 1.5 0 0 1 12 2.5v5A1.5 1.5 0 0 1 10.5 9H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 8.5H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 3h10M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5.5 6v4M7.5 6v4M2.5 3l.6 7.1A1 1 0 0 0 4.1 11h4.8a1 1 0 0 0 1-.9L10.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
