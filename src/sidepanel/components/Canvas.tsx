import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useCanvasPan } from '../hooks/useCanvasPan';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import RecenterButton from './RecenterButton';
import ContextMenu from './ContextMenu';
import CanvasItem from './CanvasItem';
import LinkInputItem from './items/LinkInputItem';
import { getFaviconUrl, getHostname } from '../lib/favicon';
import { subscribeUndo, popUndo } from '../lib/undo';
import { showToast } from '../lib/toast';
import Toast from './Toast';
import EmptyState from './EmptyState';
import type { CanvasItem as CanvasItemType } from '../../types/board';

const MemoCanvasItem = memo(CanvasItem);

interface MenuState {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
}

export default function Canvas() {
  const viewport = useBoardStore((s) => s.viewport);
  const items = useBoardStore((s) => s.items);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const setSelectedIds = useBoardStore((s) => s.setSelectedIds);
  const setViewport = useBoardStore((s) => s.setViewport);
  const addItem = useBoardStore((s) => s.addItem);
  const deleteItems = useBoardStore((s) => s.deleteItems);

  const outerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const menuJustClosed = useRef(false);
  const hadSelection = useRef(false);

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkInputPos, setLinkInputPos] = useState<{ x: number; y: number } | null>(null);

  useCanvasPan(outerRef);
  useCanvasZoom(outerRef);

  // Show toast whenever an undo entry is pushed
  useEffect(() => {
    return subscribeUndo((entry) => {
      showToast({
        message: entry.description,
        action: { label: 'Undo', onClick: () => popUndo()?.restore() },
      });
    });
  }, []);

  // Clear editing/selection if item was deleted externally
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    if (editingId && !ids.has(editingId)) setEditingId(null);
    const next = new Set([...selectedIds].filter((id) => ids.has(id)));
    if (next.size !== selectedIds.size) setSelectedIds(next);
  }, [items]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.code === 'KeyC') {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('[title="Recenter view"]')?.click();
      }

      if ((e.key === '0') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const vp = useBoardStore.getState().viewport;
        setViewport({ ...vp, zoom: 1.0 });
      }

      if (e.key === 'Escape' && !menu) {
        if (editingId) {
          setEditingId(null);
        } else {
          setSelectedIds(new Set());
        }
      }

      // Delete all selected items when not editing
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0 && !editingId) {
        const active = document.activeElement;
        if (active?.getAttribute('contenteditable') === 'true') return;
        e.preventDefault();
        deleteItems([...selectedIds]);
      }

      // Undo
      if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && !editingId) {
        e.preventDefault();
        popUndo()?.restore();
      }

      // Duplicate all selected items
      if ((e.key === 'd' || e.key === 'D') && (e.metaKey || e.ctrlKey) && selectedIds.size > 0 && !editingId) {
        e.preventDefault();
        const storeItems = useBoardStore.getState().items;
        selectedIds.forEach((selId) => {
          const item = storeItems.find((i) => i.id === selId);
          if (item) {
            addItem({
              ...item,
              id: crypto.randomUUID(),
              position: { x: item.position.x + 20, y: item.position.y + 20 },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        });
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menu, selectedIds, editingId, deleteItems, addItem]);

  // Click detection on canvas background
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    function isBackground(target: EventTarget | null) {
      return (
        target === el ||
        (target instanceof HTMLElement && target.dataset.canvasBg === 'true')
      );
    }

    function onPointerDown(e: PointerEvent) {
      if (!isBackground(e.target)) return;
      pointerDown.current = { x: e.clientX, y: e.clientY };
      hadSelection.current = selectedIds.size > 0 || editingId !== null;
      setSelectedIds(new Set());
      setEditingId(null);
      setLinkInputPos(null);
    }

    function onPointerUp(e: PointerEvent) {
      if (!pointerDown.current) return;
      if (!isBackground(e.target)) { pointerDown.current = null; return; }
      const dx = e.clientX - pointerDown.current.x;
      const dy = e.clientY - pointerDown.current.y;
      pointerDown.current = null;
      if (Math.hypot(dx, dy) >= 4) return;
      if (menu || menuJustClosed.current || hadSelection.current) return;

      const vp = useBoardStore.getState().viewport;
      setMenu({
        screenX: e.clientX,
        screenY: e.clientY,
        canvasX: (e.clientX - vp.x) / vp.zoom,
        canvasY: (e.clientY - vp.y) / vp.zoom,
      });
    }

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [menu, editingId, selectedIds]);

  const closeMenu = useCallback(() => {
    menuJustClosed.current = true;
    setMenu(null);
    setTimeout(() => { menuJustClosed.current = false; }, 0);
  }, []);

  function handleText(x: number, y: number) {
    const item: CanvasItemType = {
      id: crypto.randomUUID(),
      type: 'text',
      position: { x, y },
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addItem(item);
    setEditingId(item.id);
    setSelectedIds(new Set([item.id]));
  }

  function handleLink(x: number, y: number) {
    closeMenu();
    setLinkInputPos({ x, y });
  }

  function handleLinkConfirm(url: string) {
    const item: CanvasItemType = {
      id: crypto.randomUUID(),
      type: 'link',
      position: linkInputPos ?? { x: 40, y: 40 },
      content: null,
      url,
      title: getHostname(url),
      favicon: getFaviconUrl(url),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addItem(item);
    setLinkInputPos(null);
  }

  function handlePaste(x: number, y: number, text: string) {
    const isUrl = /^https?:\/\//i.test(text.trim());
    const item: CanvasItemType = isUrl
      ? {
          id: crypto.randomUUID(),
          type: 'link',
          position: { x, y },
          content: null,
          url: text.trim(),
          title: getHostname(text.trim()),
          favicon: getFaviconUrl(text.trim()),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : {
          id: crypto.randomUUID(),
          type: 'text',
          position: { x, y },
          content: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
    addItem(item);
    if (!isUrl) setEditingId(item.id);
  }

  const zoomPct = Math.round(viewport.zoom * 100);
  const zoomColor = viewport.zoom < 0.5 ? 'var(--accent)' : 'var(--text-muted)';

  function resetZoom() {
    const vp = useBoardStore.getState().viewport;
    setViewport({ ...vp, zoom: 1.0 });
  }

  return (
    <div
      ref={outerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--canvas-bg)',
        backgroundImage: 'radial-gradient(circle, var(--grid-dot) 1px, transparent 1px)',
        backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x % (24 * viewport.zoom)}px ${viewport.y % (24 * viewport.zoom)}px`,
        cursor: 'default',
      }}
    >
      {/* Transformed canvas layer */}
      <div
        ref={canvasRef}
        data-canvas-bg="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transformOrigin: '0 0',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          willChange: 'transform',
        }}
      >
        {items.map((item) => (
          <MemoCanvasItem
            key={item.id}
            item={item}
            isEditing={editingId === item.id}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => { setSelectedIds(new Set([item.id])); setEditingId(null); }}
            onShiftSelect={() => {
              const next = new Set(selectedIds);
              if (next.has(item.id)) next.delete(item.id);
              else next.add(item.id);
              setSelectedIds(next);
            }}
            onStartEdit={() => { setEditingId(item.id); setSelectedIds(new Set([item.id])); }}
            onStopEdit={() => { setEditingId(null); }}
            onDuplicate={() => {
              const storeItems = useBoardStore.getState().items;
              const ids = selectedIds.has(item.id) ? selectedIds : new Set([item.id]);
              ids.forEach((selId) => {
                const target = storeItems.find((i) => i.id === selId);
                if (target) {
                  addItem({
                    ...target,
                    id: crypto.randomUUID(),
                    position: { x: target.position.x + 20, y: target.position.y + 20 },
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                }
              });
            }}
          />
        ))}

        {linkInputPos && (
          <LinkInputItem
            x={linkInputPos.x}
            y={linkInputPos.y}
            onConfirm={handleLinkConfirm}
            onCancel={() => setLinkInputPos(null)}
          />
        )}
      </div>

      {/* Zoom indicator */}
      <button
        onClick={resetZoom}
        title="Reset zoom to 100%"
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          height: 24,
          padding: '0 8px',
          borderRadius: 4,
          border: '1px solid var(--toolbar-border)',
          background: 'var(--panel-bg)',
          color: zoomColor,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {zoomPct}%
      </button>

      <EmptyState />
      <RecenterButton outerRef={outerRef} canvasRef={canvasRef} />
      <Toast />

      {menu && (
        <ContextMenu
          screenX={menu.screenX}
          screenY={menu.screenY}
          canvasX={menu.canvasX}
          canvasY={menu.canvasY}
          onText={handleText}
          onLink={handleLink}
          onPaste={handlePaste}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}
