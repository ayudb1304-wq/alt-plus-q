# Alt+Q

**A spatial canvas for your browser.**

One shortcut opens a persistent side panel where you can drop links, text, and snippets anywhere — no cards, no containers, just content floating in space.

---

## What is Alt+Q?

Most browser users constantly juggle tabs, snippets, and ideas while working. Clipboard managers are flat lists. Note apps are too heavy. Whiteboards live outside the browser and require a login.

Alt+Q is a Chrome extension that gives you a persistent, infinite canvas in a side panel. Press `Alt+Q` (or click the toolbar icon), and a spatial scratch board appears. Drop links, write notes, paste snippets from webpages — arranged wherever you want. It's always there, always synced to your browser profile, no account required.

---

## Features

### Infinite Canvas
- Pan by dragging the background; zoom with the scroll wheel (25%–400%)
- GPU-accelerated via CSS `transform: translate() scale()` — smooth at 200+ items
- Dot-grid background scales with zoom for spatial orientation
- **Recenter** button animates the viewport to fit all your content
- **Zoom badge** in the corner shows current zoom; click or `Ctrl+0` to reset to 100%

### Three Item Types

**Text items** — click the canvas, choose Text, and start typing. Supports rich text: **bold**, *italic*, `inline code`, and code blocks. Double-click any item to edit. Width is resizable by dragging the right edge.

**Link items** — paste a URL or use "Add current tab" in the toolbar. Shows favicon + page title. Click to open in a new tab. Hover for the full URL tooltip.

**Snippet items** — select text on any webpage, right-click → "Send selection to Alt+Q Board". Saves the text with the source URL attached. Hover to see "from: domain.com" attribution.

### Context Menu
Click anywhere on the empty canvas to get a floating menu:
- **Text** — creates a text item at that position, ready to type
- **Link** — inline URL input that resolves to a link item on confirm
- **Paste** — smart paste: URLs become link items, plain text becomes a text item

### Item Actions (bubble menu on select)
Each item gets a floating action bar when selected:
- **Edit** — enter inline edit mode
- **Copy** — copies text content or URL to clipboard (icon turns green on success)
- **Duplicate** — creates a copy offset by 20px
- **Delete** — removes immediately, with undo toast

### Multi-Select
- Shift+click items to add them to the selection
- Drag any selected item to move all selected items together
- Delete or duplicate all selected items at once

### Undo
- Delete an item → "Item deleted — Undo" toast appears bottom-right
- Click Undo in the toast or press `Ctrl/Cmd+Z` to restore
- Undo stack holds the last 20 actions (delete, multi-delete, clear board, move)
- Stack clears on panel close (not persisted across sessions)

### Persistence
- Everything saves to `chrome.storage.local` — no backend, no account
- Board state (all items + positions) and viewport (pan/zoom) are restored exactly on reopen
- Writes are debounced 300ms to avoid excessive storage calls

### Empty State
- Fresh board shows a centered welcome message with hint chips
- Disappears when you add your first item
- Reappears after "Clear board" — not on deleting individual items

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Q` | Open / close the side panel |
| `Escape` | Close menu / exit edit mode / deselect all |
| `Ctrl/Cmd+Z` | Undo last action |
| `Delete` / `Backspace` | Delete selected item(s) |
| `Ctrl/Cmd+D` | Duplicate selected item(s) |
| `Ctrl/Cmd+0` | Reset zoom to 100% |
| `Alt+C` | Recenter viewport |
| `Shift+click` | Add item to selection |
| `Ctrl/Cmd+B` | Bold (in edit mode) |
| `Ctrl/Cmd+I` | Italic (in edit mode) |
| `Ctrl/Cmd+\`` | Inline code (in edit mode) |
| `Space` + drag | Pan canvas |

---

## Tech Stack

| Concern | Choice |
|---|---|
| Platform | Chrome Extension, Manifest V3 |
| Language | TypeScript (strict) |
| UI | React 18 (functional components + hooks) |
| Bundler | Vite + `vite-plugin-web-ext` |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Rich text | Tiptap (headless) |
| State | Zustand with `subscribeWithSelector` |
| Drag / position | Custom pointer event handlers |
| Canvas pan/zoom | CSS `transform` on a single container div |
| Storage | `chrome.storage.local` (no backend) |
| Fonts | Outfit (sans-serif), Geist Mono (monospace) |

---

## Project Structure

```
src/
  background/
    background.ts          # Service worker: context menus, storage init, panel toggle
  sidepanel/
    sidepanel.html         # Side panel HTML entry
    main.tsx               # React root
    App.tsx                # Root component, hydration, flash timing
    components/
      Canvas.tsx           # Pan/zoom container, keyboard shortcuts, pointer handlers
      CanvasItem.tsx       # Dispatches to item type components
      Toolbar.tsx          # Top bar: wordmark, Add tab, Shortcuts, More menu
      ContextMenu.tsx      # Floating add menu on canvas click
      RichTextEditor.tsx   # Tiptap wrapper (view + edit modes)
      EmptyState.tsx       # Shown on empty board
      RecenterButton.tsx   # Fits all items in view
      Toast.tsx            # Undo / error notifications
      ShortcutsModal.tsx   # Keyboard shortcut reference overlay
      items/
        SnippetItem.tsx    # Snippet card with source attribution
        LinkItem.tsx       # Favicon + title link card
        LinkInputItem.tsx  # Inline URL input for adding links
    store/
      boardStore.ts        # Zustand store: items, viewport, selectedIds, undo hooks
    hooks/
      useStorageSync.ts    # Subscribes to store, debounced writes to chrome.storage.local
      useCanvasPan.ts      # Space+drag and background-drag panning
      useCanvasZoom.ts     # Scroll wheel / trackpad zoom
      useDrag.ts           # Pointer-capture drag with multi-select support + undo on drop
    lib/
      storage.ts           # chrome.storage.local abstraction
      favicon.ts           # Google favicon service + fallback SVG
      flash.ts             # Module-level flash signal (amber ring animation on new items)
      undo.ts              # In-memory undo stack (max 20, LIFO, subscribe pattern)
      toast.ts             # Module-level toast signal (single listener)
      placement.ts         # Grid-scan algorithm to find free canvas position
      viewport.ts          # Viewport helpers: center, free position with store awareness
      tiptap.ts            # Tiptap editor configuration
  types/
    board.ts               # CanvasItem, BoardState, ViewportState, RichTextNode
public/
  manifest.json            # MV3 manifest
  icons/                   # Extension icons (16, 48, 128px)
```

---

## How It Works — Key Design Decisions

**Free positioning without a grid.** Items are absolutely positioned within a CSS-transformed container div. Pan and zoom are a single `transform: translate(x, y) scale(z)` on that container — no canvas element, no WebGL. This keeps text selectable, accessible, and easily composed with React components.

**Smart item placement.** When items are added while the side panel is closed (via right-click context menu), they're stored with a sentinel position `{ x: -99999, y: -99999 }`. On next panel open, the store detects these and runs a grid-scan algorithm to place each one in the first available empty slot in the current viewport, then triggers a flash animation to highlight newly placed items.

**Undo without Zustand.** The undo stack, toast notifications, and flash animations all use a simple module-level signal pattern (a single subscriber callback + a stack/queue). This avoids prop drilling and keeps React re-renders targeted — only the component that subscribed re-renders, not the whole tree.

**Multi-drag via store.** `useDrag` reads `selectedIds` directly from the Zustand store on `pointerdown`. If the dragged item is in the selection, it captures start positions for all selected items and moves them together. On `pointerup`, it pushes a single undo entry that restores all start positions.

**No circular imports.** `boardStore.ts` needs placement logic at hydration time, and `viewport.ts` needs the store for viewport coordinates. Solved by extracting a pure `findFreePosition(viewport, panelW, panelH, existingItems)` function into `lib/placement.ts` — no store import — which both files can import safely.

---

## Installation (Development)

```bash
# Clone and install
git clone https://github.com/ayudb1304-wq/alt-plus-q.git
cd alt-plus-q
npm install

# Build
npm run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode" (top right toggle)
# 3. Click "Load unpacked"
# 4. Select the dist/ folder

# Development with watch mode
npm run dev
```

> After a `npm run dev` rebuild, you may need to click the reload icon on the extension card in `chrome://extensions` and then close/reopen the side panel. This is a Chrome side panel limitation — the panel is not automatically re-instantiated on extension reload.

### Type checking

```bash
npm run tsc -- --noEmit
```

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Saves board state to `chrome.storage.local` |
| `contextMenus` | Right-click "Send tab" and "Send selection" actions |
| `tabs` | Read current tab title and URL for "Add current tab" |
| `sidePanel` | Open/close the side panel programmatically |

No data leaves your browser. The only external network call is to `https://www.google.com/s2/favicons` to resolve favicons for link items (only the domain name is sent, not the full URL).

---

## Roadmap

- [ ] Export board as JSON or Markdown
- [ ] Multiple named boards (Work, Study, Side Projects)
- [ ] Image items (paste or drop from desktop)
- [ ] Cloud sync with optional account (cross-device)
- [ ] Firefox / Edge support
- [ ] Canvas resize handles per item
- [ ] Cmd+F to search items
