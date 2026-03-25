# Alt+Q — Product Requirements Document

---

## 1. Product Overview

### 1.1 Product Name

**Alt+Q** (working title: Visual Board — update before store listing)

**One-liner:**
A spatial canvas for your browser. One shortcut opens a persistent side panel where you can drop links, text, and snippets anywhere — no cards, no containers, just content floating in space.

### 1.2 Problem Statement

Browser users constantly juggle tabs, snippets, and ideas while working, but existing tools fall short in distinct ways:

- **Linear clipboard managers** are great for repeated paste but offer no spatial organization — everything is a flat list.
- **Heavy note-taking apps** (Notion, Obsidian) require folders, tags, and rich editors; far too much friction for quick capture.
- **Whiteboard tools** (Miro, FigJam) are powerful but live outside the browser, require logins, and are designed for teams — not a personal scratch space.
- **Browser bookmarks** are hierarchical and invisible during active work.

Users need a fast, persistent, spatial layer inside the browser — a place to drop "what I'm working on right now" and arrange it visually, without ever leaving the page they're on.

### 1.3 Product Vision

Become the fastest way for browser-centric users — developers, students, PMs, founders — to visually organize their active work without leaving the browser, creating an account, or learning a new tool.

---

## 2. Goals and Non-Goals

### 2.1 Goals (v1)

- Open a persistent global canvas in a Chrome side panel via keyboard shortcut (`Alt+Q`) or toolbar icon.
- Allow users to place content freely anywhere on an infinite canvas:
  - Text blocks (with basic rich-text: bold, italic, inline code).
  - Link items (favicon + resolved page title, clickable).
  - Selected text snippets from any webpage (with source URL attached).
- No visible card containers — content floats on the canvas with zero chrome at rest.
- Infinite canvas with pan (drag background) and zoom (scroll wheel), plus a "Return to content" button if the user navigates too far from their items.
- Persist all content and positions locally; auto-restore on browser restart.
- No account, no backend, no network calls beyond favicon resolution in v1.

### 2.2 Non-Goals (v1)

- No real-time multi-user collaboration.
- No complex text formatting (headings, checklists, tables, embeds).
- No nested boards, folders, or workspaces.
- No mobile or Firefox/Edge support (desktop Chrome only).
- No cross-device sync (planned for Pro tier post-MVP).
- No image upload or drag-in from desktop in v1.

---

## 3. Target Users

| Persona | Use case |
|---|---|
| **Developer / Founder** | Plan a side project — repos, docs, links, todos scattered spatially by context. |
| **Student / Researcher** | Collect sources, quotes, and links; arrange them into loose spatial clusters like "Background / Methods / Results". |
| **PM / Knowledge Worker** | Maintain a lightweight "This week" or "Current priorities" board anchored to the browser session. |

**Early adopter profile:** Comfortable installing Chrome extensions. Values speed and minimalism over feature depth. Likely already uses tools like Raycast, Arc, or Linear — appreciates keyboard-first workflows.

---

## 4. Core User Flows

### 4.1 Open / Close Board

**Triggers:**
- Click the extension toolbar icon, or
- Press `Alt+Q` (global keyboard shortcut; configurable in a later version).

**Behaviour:**
- Opens as a Chrome Side Panel attached to the browser window — persistent across tab switches.
- If already open, clicking the toolbar icon closes the panel.
- Board content is global: identical across all tabs in the same browser profile.
- The side panel width is resizable by the user via the native Chrome side panel drag handle.

### 4.2 Add Content to Canvas

**Trigger:**
- Click on any empty area of the canvas.

**Behaviour:**
- A small floating context menu appears near the click point containing three actions:
  - **T Text** — creates a new empty text item at that position and immediately focuses it for typing.
  - **🔗 Link** — opens a small inline input at that position; user pastes or types a URL and confirms.
  - **📋 Paste** — pastes the current clipboard content as the most appropriate item type (URL → link item; text → text item). If clipboard is empty, this option is greyed out.
- The menu dismisses on `Escape` or clicking outside.

### 4.3 Add Current Tab as a Link Item

**Triggers:**
- From within the board, click "Add current tab" in the toolbar.
- Right-click context menu on any page → "Send tab to Alt+Q Board".

**Behaviour:**
- Creates a link item at a default position (top-left unoccupied region of the visible canvas).
- Fields auto-filled: favicon, resolved page title, URL.
- The item is immediately selected so the user can drag it to the desired position.

### 4.4 Add Selected Text as a Snippet

**Trigger:**
- User selects text on any webpage → right-click → "Send selection to Alt+Q Board".

**Behaviour:**
- Creates a text item containing the selected text, with the source URL attached as metadata (visible on hover as a subtle "from: example.com" label).
- Item appears at the default drop position and is immediately selected.

### 4.5 Interact with Canvas Items

#### Selection and movement
- **Single click** on a resting item: selects it, reveals a faint highlight ring around the content bounds.
- **Drag** a selected item: item follows the cursor in real time; position saved on release.
- **Shift+click** additional items: adds them to the selection. All selected items can be dragged together.
- **Click empty canvas**: deselects all.

#### Item action bar (visible on hover / selection)
A minimal floating action bar appears near the item containing:
- ✏️ **Edit** — enters inline edit mode; cursor placed in text. For link items, opens the URL edit field.
- 📋 **Copy** — copies text content or URL to the system clipboard.
- ⧉ **Duplicate** — creates a copy of the item 16px offset from the original.
- 🗑 **Delete** — removes the item immediately (no confirmation dialog; `Cmd+Z` / `Ctrl+Z` undoes).

#### Inline editing
- Double-click any item OR click the Edit action to enter edit mode.
- For text items: a minimal rich-text toolbar appears on text selection with **Bold** (`Cmd/Ctrl+B`), *Italic* (`Cmd/Ctrl+I`), and `Inline code` (`` Cmd/Ctrl+` ``).
- Press `Escape` to exit edit mode; changes are saved automatically.

### 4.6 Navigate the Canvas

- **Pan:** Click and drag the background (cursor becomes a grab hand).
- **Zoom:** Scroll wheel (or trackpad pinch). Zoom range: 25% – 400%.
- **Return to content:** A persistent "⌖ Recenter" button in the bottom-right corner of the panel. Clicking it animates the viewport to fit all existing items in view. Appears prominently if the user has panned/zoomed away from all content.
- **Zoom level indicator:** A subtle percentage badge (e.g., "100%") in the bottom-right corner; clicking it resets zoom to 100% without changing pan position.

### 4.7 Persistence and Restore

- All items and their canvas positions are stored in `chrome.storage.local`.
- On extension load, the board reads from storage and renders the previous state.
- The last viewport position (pan x/y, zoom level) is also persisted and restored.
- Removing the extension clears stored data per Chrome's behaviour.

---

## 5. Feature Specification (MVP)

### 5.1 Canvas

- **Type:** Infinite 2D canvas.
- **Background:** Off-white in light mode (`#F8F7F4`); dark charcoal in dark mode (`#141414`). No grid, no dots, no lines.
- **Pan:** Drag background; cursor changes to `grab` on hover, `grabbing` while dragging.
- **Zoom:** Scroll wheel / trackpad pinch. Smooth CSS `transform: scale()` on the canvas container.
- **Overflow:** No scrollbars — panning replaces scrolling. Canvas is effectively unbounded.
- **Theme:** Follows OS `prefers-color-scheme`; no manual toggle in v1.

### 5.2 Item Types

All items share common properties: `id`, `type`, `x`, `y`, `width`, `createdAt`, `updatedAt`.

#### Text Item
- **Content:** Plain-ish text with optional inline formatting (bold, italic, inline code via basic rich-text editor).
- **Width:** Fixed at 240px; height grows with content.
- **Appearance at rest:** Text renders directly on the canvas with no background or border.
- **Appearance on hover:** A faint rounded rectangle (`border-radius: 8px`, `background: rgba(0,0,0,0.04)` in light / `rgba(255,255,255,0.05)` in dark) appears behind the content — indicating it's interactive without looking like a card.
- **Font:** `Outfit` (sans-serif variable), `16px`, line-height `1.5`.
- **Code spans:** `Geist Mono`, `13px`, styled with a subtle inline background pill.

#### Link Item
- **Content:** Favicon (16×16) + resolved page title, displayed inline as a single line.
- **Width:** Fixed at 240px; text truncates with ellipsis if title exceeds one line.
- **Appearance at rest:** Favicon + title sit directly on the canvas. Title is styled in the accent color (`#F59E0B`) to signal clickability.
- **Appearance on hover:** Same faint rounded ghost background as text items. A "↗" open-in-new-tab icon appears at the right edge.
- **Click behaviour:** Single click on a link item (when not in edit mode) opens the URL in a new tab.
- **URL display:** Full URL is shown in a tooltip on hover.
- **Favicon resolution:** Use `https://www.google.com/s2/favicons?domain={domain}&sz=32`; fall back to a generic link icon if unavailable.
- **Font:** `Outfit`, `14px` for title; `Geist Mono`, `11px` for the domain shown in the tooltip.

#### Snippet Item
- **Content:** Selected text (plain text), with source URL stored as metadata.
- **Width:** Fixed at 240px; height grows with content.
- **Appearance at rest:** Text renders on canvas like a text item.
- **Source attribution:** On hover, a "from: domain.com" line appears below the text content in muted type (`Outfit`, `11px`, 40% opacity).

### 5.3 Toolbar

A slim, fixed toolbar sits at the top of the side panel. It contains:
- **Alt+Q logo / wordmark** (left-aligned).
- **+ Add tab** button — captures the current tab as a link item.
- **⌨ Shortcuts** button — opens a small modal listing keyboard shortcuts.
- **⋯ More** menu (right-aligned) — contains: Export board (JSON), Clear board (with confirmation), About.

The toolbar is always visible and does not scroll with the canvas.

### 5.4 Empty State

Shown when the board has zero items (first use and after clearing):

- Centered on the canvas: a welcome message and three hint chips.
- **Heading:** "Your board is empty." (`Outfit`, `18px`, muted color).
- **Sub-line:** "Click anywhere to start, or add your current tab." (`Outfit`, `14px`, lighter muted).
- **Hint chips:** `[ Click anywhere ]` · `[ Paste a link ]` · `[ Alt+Q ]` — styled as ghost pill buttons.
- The empty state disappears permanently once the first item is placed (not restored on delete-all in the same session; only shown on fresh install or explicit "Clear board").

### 5.5 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Q` | Open / close the side panel |
| `Escape` | Close the context menu OR exit edit mode OR deselect all |
| `Cmd/Ctrl+Z` | Undo last destructive action (delete, move) |
| `Delete` / `Backspace` | Delete selected item(s) (when not in edit mode) |
| `Cmd/Ctrl+D` | Duplicate selected item(s) |
| `Cmd/Ctrl+C` | Copy content of selected item to clipboard |
| `Cmd/Ctrl+B` | Bold (in text edit mode) |
| `Cmd/Ctrl+I` | Italic (in text edit mode) |
| `` Cmd/Ctrl+` `` | Inline code (in text edit mode) |
| `Space` + drag | Pan canvas (alternative to dragging background directly) |
| `Cmd/Ctrl+0` | Reset zoom to 100% |
| `Cmd/Ctrl+Shift+H` | Recenter viewport to fit all content |

### 5.6 Storage and Data Model

```ts
type ItemType = 'text' | 'link' | 'snippet';

interface RichTextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

interface CanvasItem {
  id: string;               // UUID v4
  type: ItemType;
  content: RichTextNode[];  // for text/snippet; single plain node for links
  url?: string;             // link and snippet items
  title?: string;           // resolved page title for link items
  favicon?: string;         // resolved favicon URL
  sourceUrl?: string;       // snippet items: source page URL
  x: number;                // canvas position (px, in canvas coordinate space)
  y: number;
  width: number;            // fixed per type; stored for future resizability
  createdAt: number;        // Unix ms
  updatedAt: number;
}

interface ViewportState {
  x: number;   // pan offset
  y: number;
  zoom: number; // e.g. 1.0 = 100%
}

interface BoardState {
  items: CanvasItem[];
  viewport: ViewportState;
  version: number;          // schema version for future migrations
}
```

- **Storage:** `chrome.storage.local` for `BoardState`. Writes are debounced 300ms after any change.
- **Quota:** `chrome.storage.local` has a ~10MB quota. Suitable for text and metadata; no binary blobs stored.
- **Abstraction:** All reads/writes go through a `storage.ts` module to allow swapping to IndexedDB or remote sync later.
- **Undo:** Last 20 destructive actions (item delete, bulk delete) stored in an in-memory undo stack (not persisted across sessions).

---

## 6. Design System

### 6.1 Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| UI labels, item text, body | `Outfit` (sans-serif) | 16px body / 14px secondary / 11px micro | 400 / 500 / 600 |
| Inline code, URL tooltips, zoom indicator | `Geist Mono` (monospace) | 13px code / 11px micro | 400 |

Both fonts loaded via CSS `@font-face` or CDN; subsetted to Latin to minimize bundle size.

```css
:root {
  --font-sans: 'Outfit', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'Fira Code', monospace;
}
```

### 6.2 Color Palette

#### Accent (Amber)
| Token | Light | Dark |
|---|---|---|
| `--accent` | `#F59E0B` | `#FBBF24` |
| `--accent-hover` | `#D97706` | `#F59E0B` |
| `--accent-subtle` | `#FFFBEB` | `#2D1F00` |

#### Canvas background
| Token | Light | Dark |
|---|---|---|
| `--canvas-bg` | `#F8F7F4` | `#141414` |
| `--panel-bg` | `#FFFFFF` | `#1C1C1C` |
| `--toolbar-bg` | `#FAFAFA` | `#1C1C1C` |
| `--toolbar-border` | `#E5E5E5` | `#2A2A2A` |

#### Item hover ghost
| Token | Light | Dark |
|---|---|---|
| `--item-hover-bg` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.05)` |
| `--item-selected-ring` | `rgba(245,158,11,0.35)` | `rgba(251,191,36,0.3)` |

#### Text
| Token | Light | Dark |
|---|---|---|
| `--text-primary` | `#111111` | `#F0F0F0` |
| `--text-secondary` | `#555555` | `#999999` |
| `--text-muted` | `#AAAAAA` | `#555555` |

### 6.3 Motion and Transitions

- Item hover ghost background: `transition: background 120ms ease`.
- Item drag: no transition (must follow cursor at 1:1 without lag).
- Canvas zoom: `transition: transform 80ms ease` when triggered via button; none on scroll wheel.
- Context menu appear: `scale(0.95) → scale(1)` + `opacity(0) → opacity(1)`, `80ms ease-out`.
- Recenter animation: `transform` eased over `250ms ease-in-out`.
- Undo toast: slide in from bottom-right, auto-dismiss after `3s`.

### 6.4 Side Panel Dimensions

- **Default width:** 360px.
- **Minimum width:** 280px (Chrome side panel minimum).
- **Maximum width:** 600px.
- **Toolbar height:** 48px, fixed.
- **Canvas area:** Fills remainder of panel height.

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Side panel first paint: under 150ms on a modern machine.
- Canvas panning at 200+ items must run at 60fps. Use CSS `transform` (GPU-composited) for pan/zoom rather than re-laying out DOM elements.
- Drag responsiveness: item must follow cursor with ≤1 frame lag. No debounce on drag events.
- Storage writes: debounced 300ms; never block the main thread.
- Font loading: both `Outfit` and `Geist Mono` must not cause layout shift. Use `font-display: swap` with a matching system font as fallback.

### 7.2 Privacy and Security

- v1 is fully local-first. No analytics, no telemetry, no external API calls except:
  - Google Favicon service for link item icons (a domain name is sent, not the full URL).
- Content Security Policy in `manifest.json` must block all inline scripts and restrict external sources to the favicon service only.
- No `eval`, no `innerHTML` assignment with unsanitized content. All user content rendered through React's virtual DOM.
- Paste handling must sanitize HTML input and extract plain text only.

### 7.3 Compatibility

- **Target:** Chrome Manifest V3, latest stable Chrome.
- **Chromium browsers** (Edge, Brave, Arc): likely compatible; not officially supported in v1.
- **Side Panel API:** Requires Chrome 114+. The manifest must declare `"side_panel"` permission and provide a `side_panel.default_path`.

---

## 8. Tech Stack and Architecture

### 8.1 Platform and Manifest

- **Platform:** Chrome Extension, Manifest V3.
- **Key manifest entries:**
  - `"side_panel": { "default_path": "sidepanel.html" }`
  - `"permissions": ["storage", "contextMenus", "tabs", "sidePanel"]`
  - `"action": {}` — toolbar icon click opens the side panel.
  - `"background": { "service_worker": "background.js" }`

### 8.2 Frontend

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Type safety for the data model and storage layer. |
| UI library | React 18 (functional + hooks) | Familiar, fast to build, good ecosystem for drag-and-drop. |
| Bundler | Vite + `vite-plugin-web-ext` | Fast HMR in development; clean extension build output. |
| Styling | Tailwind CSS v4 + CSS variables | Utility-first for speed; CSS vars for theming tokens. |
| Rich text | `Tiptap` (headless) | Lightweight, extensible; supports only the marks we need (bold, italic, code). Renders to JSON that maps cleanly to `RichTextNode[]`. |
| Drag and position | Custom pointer event handlers | No dependency needed for free-positioning on a CSS transform canvas. |
| Canvas pan/zoom | CSS `transform: translate() scale()` on a single container div | GPU-composited; no canvas element needed for text content. |

### 8.3 State Management

- **In-memory state:** Zustand store (`boardStore.ts`). Single source of truth for `items[]` and `viewport`.
- **Persistence sync:** A `useStorageSync` hook subscribes to the Zustand store and writes to `chrome.storage.local` on every change (debounced 300ms).
- **Hydration:** On mount, the store reads from `chrome.storage.local`. If empty, initializes with an empty `BoardState`.
- **Undo stack:** Separate in-memory array in the Zustand store; not persisted.

### 8.4 Background Service Worker (`background.ts`)

**Responsibilities:**
1. `runtime.onInstalled` → initialize empty `BoardState` in storage if none exists.
2. Context menu setup — register "Send tab to Alt+Q Board" and "Send selection to Alt+Q Board".
3. `contextMenus.onClicked` → parse the click info and `chrome.storage.local.get/set` to prepend the new item to the board.
4. `action.onClicked` → toggle the side panel via `chrome.sidePanel.open()` / `close()`.

### 8.5 File Structure

```
src/
  background/
    background.ts          # service worker entry
  sidepanel/
    sidepanel.html         # HTML entry for side panel
    main.tsx               # React root
    App.tsx                # root component
    components/
      Toolbar.tsx
      Canvas.tsx           # pan/zoom container + pointer handlers
      CanvasItem.tsx       # renders a single item (text/link/snippet)
      ContextMenu.tsx      # floating add menu on canvas click
      ActionBar.tsx        # hover/select action bar
      RichTextEditor.tsx   # Tiptap wrapper
      EmptyState.tsx
      RecenterButton.tsx
    store/
      boardStore.ts        # Zustand store
    hooks/
      useStorageSync.ts
      useCanvasPan.ts
      useCanvasZoom.ts
      useDrag.ts
    lib/
      storage.ts           # chrome.storage abstraction
      favicon.ts           # favicon URL resolution
      undo.ts              # undo stack helpers
      sanitize.ts          # paste/input sanitization
    types/
      board.ts             # CanvasItem, BoardState, etc.
  assets/
    icons/                 # extension icons (16, 32, 48, 128px)
public/
  manifest.json
```

---

## 9. Context Menus and Permissions

| Permission | Purpose |
|---|---|
| `"storage"` | `chrome.storage.local` read/write for board state. |
| `"contextMenus"` | Right-click "Send tab" and "Send selection" actions. |
| `"tabs"` | Read current tab title and URL for "Add current tab". |
| `"sidePanel"` | Open/close the side panel programmatically. |

Content Security Policy (in `manifest.json`):
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; img-src 'self' https://www.google.com data:;"
}
```

---

## 10. Future Roadmap (Post-MVP)

Decisions in v1 should not block these:

| Feature | Notes |
|---|---|
| **Cloud sync** | Backend: Node/TypeScript (Fastify). Auth: magic link or Sign in with Google. The `storage.ts` abstraction layer makes swapping the backend non-breaking. |
| **Multiple boards** | Work, Study, Side Projects. Zustand store supports multiple named board slices. |
| **Image items** | Drop or paste images onto canvas. Store as base64 or blob URLs in IndexedDB (not `chrome.storage.local`). |
| **Export** | JSON export of full `BoardState`; Markdown export of text/snippet items. |
| **Canvas resize handles** | Let users resize individual items. The `width` field in the schema already supports this. |
| **Firefox / Edge** | Port to WebExtensions API v3. Most frontend code is reusable; only `chrome.*` calls need abstraction wrappers. |
| **Zoom and pan persistence** | Already in the v1 data model (`ViewportState`). |

---

## 11. Success Metrics

### Activation
- % of installers who open the board panel at least 3 times in the first 7 days.
- % of installers who place their first item within the first session.

### Engagement
- Median number of items created per active user per week.
- % of users with >20 items (indicates genuine adoption vs. curiosity install).
- % of sessions where the user panned or zoomed the canvas (indicates spatial use, not just list use).

### Retention
- 7-day and 30-day active users / total installers.

### Qualitative
- In-board survey triggered after 5th item creation. Single question, dismissible:
  - "Does Alt+Q make your browser workflow better?" (👍 / 👎 + optional text).
- Follow-up prompt for users who answer 👍:
  - "Would you use cloud sync and multiple boards?" — validates Pro tier interest.
