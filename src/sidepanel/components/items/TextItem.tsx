import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useDrag } from '../../hooks/useDrag';
import RichTextEditor from '../RichTextEditor';
import { subscribeFlash, isFlashing } from '../../lib/flash';
import type { Editor } from '@tiptap/react';
import type { CanvasItem } from '../../../types/board';
import type { RichTextNode } from '../../../types/board';

const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 160;

interface Props {
  item: CanvasItem;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onShiftSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDuplicate: () => void;
}

export default function TextItem({
  item,
  isEditing,
  isSelected,
  onSelect,
  onShiftSelect,
  onStartEdit,
  onStopEdit,
  onDuplicate,
}: Props) {
  const updateItem = useBoardStore((s) => s.updateItem);
  const deleteItem = useBoardStore((s) => s.deleteItem);
  const zoom = useBoardStore((s) => s.viewport.zoom);
  const [hovered, setHovered] = useState(false);
  const [editorHasSelection, setEditorHasSelection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flashing, setFlashing] = useState(() => isFlashing(item.id));

  useEffect(() => subscribeFlash(item.id, setFlashing), [item.id]);
  const editorRef = useRef<Editor | null>(null);
  const { onPointerDown, wasDragging } = useDrag(item.id);

  // Resize
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const isResizing = useRef(false);

  const itemWidth = item.width ?? DEFAULT_WIDTH;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isEditing) return;
    if (e.shiftKey) { e.stopPropagation(); return; }
    onPointerDown(e);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (isEditing) return;
    if (e.shiftKey) { onShiftSelect(); return; }
    if (wasDragging.current) return;
    onSelect();
  }

  function handleDoubleClick() {
    if (!isEditing) onStartEdit();
  }

  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = itemWidth;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isResizing.current) return;
    const dx = (e.clientX - resizeStartX.current) / zoom;
    const newWidth = Math.max(MIN_WIDTH, resizeStartWidth.current + dx);
    updateItem(item.id, { width: newWidth });
  }

  function handleResizePointerUp() {
    isResizing.current = false;
  }

  const handleSave = useCallback((content: RichTextNode, isEmpty: boolean) => {
    if (isEmpty) {
      deleteItem(item.id);
    } else {
      updateItem(item.id, { content });
    }
    onStopEdit();
  }, [item.id, deleteItem, updateItem, onStopEdit]);

  const showBg = hovered || isSelected || isEditing;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
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
        boxShadow: isSelected ? '0 0 0 2px var(--item-selected-ring)' : 'none',
        animation: flashing ? 'item-breathe 1.4s ease-out forwards' : 'none',
        transition: 'background 120ms ease, box-shadow 120ms ease, padding 120ms ease',
        cursor: isEditing ? 'text' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* Item-level bubble */}
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
          {!isEditing ? (
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onStartEdit(); }}
              style={itemBtn()}
            >
              Edit
            </button>
          ) : (
            <>
              <FormatButton
                onMouseDown={(e) => { e.preventDefault(); editorRef.current?.chain().focus().toggleBold().run(); }}
                label="B"
                style={{ fontWeight: 700 }}
              />
              <FormatButton
                onMouseDown={(e) => { e.preventDefault(); editorRef.current?.chain().focus().toggleItalic().run(); }}
                label="I"
                style={{ fontStyle: 'italic' }}
              />
              <FormatButton
                onMouseDown={(e) => { e.preventDefault(); editorRef.current?.chain().focus().toggleCode().run(); }}
                label="`"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
              <FormatButton
                onMouseDown={(e) => { e.preventDefault(); editorRef.current?.chain().focus().toggleCodeBlock().run(); }}
                label="{ }"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              />
            </>
          )}
          <div style={{ width: 1, height: 16, background: 'var(--toolbar-border)', margin: '0 2px' }} />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const text = editorRef.current?.getText() ?? '';
              navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 800);
              });
            }}
            style={{ ...itemBtn(), color: copied ? '#22c55e' : 'var(--text-secondary)', transition: 'color 150ms ease' }}
            title="Copy text"
          >
            <CopyIcon />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }}
            style={itemBtn()}
            title="Duplicate item"
          >
            <DuplicateIcon />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!editorHasSelection) deleteItem(item.id);
            }}
            style={itemBtn(editorHasSelection ? 'muted' : 'danger')}
            title={editorHasSelection ? 'Deselect text to delete' : 'Delete item'}
          >
            <TrashIcon />
          </button>
        </div>
      )}

      {/* Resize handle */}
      {isSelected && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          style={{
            position: 'absolute',
            right: -8,
            top: 0,
            bottom: 0,
            width: 16,
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div style={{
            width: 3,
            height: 24,
            borderRadius: 2,
            background: 'var(--item-selected-ring)',
            opacity: 0.6,
          }} />
        </div>
      )}

      <RichTextEditor
        content={item.content ?? { type: 'doc', content: [{ type: 'paragraph' }] }}
        isEditing={isEditing}
        onSave={handleSave}
        onEditorReady={(e) => {
          editorRef.current = e;
          e.on('selectionUpdate', () => setEditorHasSelection(!e.state.selection.empty));
          e.on('blur', () => setEditorHasSelection(false));
        }}
      />
    </div>
  );
}

function FormatButton({
  onMouseDown,
  label,
  style,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  label: string;
  style?: React.CSSProperties;
}) {
  return (
    <button onMouseDown={onMouseDown} style={{ ...itemBtn(), ...style }}>
      {label}
    </button>
  );
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

function itemBtn(variant?: 'danger' | 'muted'): React.CSSProperties {
  return {
    height: 26,
    padding: '0 8px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: variant === 'danger' ? 'var(--danger)'
         : variant === 'muted'  ? 'var(--text-muted)'
         : 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 600,
    cursor: variant === 'muted' ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    opacity: variant === 'muted' ? 0.4 : 1,
  };
}
