# Alt+Q — Feature Implementation Guide

> **How to use this document**
> Work through phases in order. A phase is complete only when every item in its **Tests to Pass** checklist is verified manually in Chrome. Do not start the next phase until the current one is fully green. Each test is written as a concrete, observable browser action — no ambiguity about what "passing" means.

---

## Phase 1 — Project Setup + Manifest

### What to build

Scaffold the repository: Vite + React + TypeScript project wired up as a Chrome MV3 extension with a working side panel entry point.

### Deliverables

- `package.json` with dependencies: `react`, `react-dom`, `typescript`, `vite`, `vite-plugin-web-ext`, `tailwindcss`, `zustand`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-code`.
- `public/manifest.json` — MV3 manifest with `side_panel`, `storage`, `contextMenus`, `tabs`, `sidePanel` permissions.
- `src/sidepanel/sidepanel.html` — HTML entry for the side panel.
- `src/sidepanel/main.tsx` — React root mounting `<App />`.
- `src/sidepanel/App.tsx` — placeholder `<div>Alt+Q is alive</div>`.
- `src/background/background.ts` — empty service worker with `console.log('SW ready')`.
- `src/types/board.ts` — full TypeScript interfaces (`CanvasItem`, `BoardState`, `ViewportState`, `RichTextNode`, `ItemType`).
- CSS variables defined in `index.css`: `--font-sans`, `--font-mono`, all color tokens from the design system.
- Outfit and Geist Mono font imports in `index.css`.

### Key implementation notes

- `vite.config.ts` must emit `background.js` and `sidepanel.html` as separate entry points in `dist/`.
- `manifest.json` must include `"side_panel": { "default_path": "sidepanel.html" }` and `"action": {}`.
- Tailwind must be configured with the custom font and color tokens so they are available as utility classes throughout the project.
- Set `"type": "module"` in `package.json`; ensure `tsconfig.json` uses `"moduleResolution": "bundler"`.

### Edge cases

- Chrome will reject the extension silently if `manifest.json` has any JSON errors — validate it.
- The `background.ts` service worker must not import any DOM APIs; it runs in a different context.
- If `vite-plugin-web-ext` hot-reloads the extension, the side panel may need a manual refresh in Chrome — document this in a `README.md` note.

### Tests to pass before moving to Phase 2

- [x] Running `npm run build` produces a `dist/` folder with no errors.
- [x] Loading `dist/` as an unpacked extension in `chrome://extensions` shows no errors in the extension card.
- [x] Clicking the Alt+Q toolbar icon opens a side panel containing the text "Alt+Q is alive".
- [x] The side panel persists when switching between browser tabs (does not close or reload).
- [x] Opening `chrome://extensions` → Inspect service worker shows the console message "SW ready".
- [x] `chrome://extensions` shows all declared permissions listed correctly (storage, contextMenus, tabs, sidePanel).
- [x] Inspecting the side panel DevTools shows `Outfit` loaded as the document font (check Computed Styles on `<body>`).
- [x] Inspecting the side panel DevTools shows `Geist Mono` available (add a temporary `<code>` element to confirm).
- [x] All TypeScript interfaces in `src/types/board.ts` compile without errors (`npm run tsc --noEmit`).

---

## Phase 2 — Storage Layer

### What to build

A typed storage abstraction module that reads and writes `BoardState` to `chrome.storage.local`, plus initialization logic.

### Deliverables

- `src/sidepanel/lib/storage.ts`:
  - `getBoardState(): Promise<BoardState>` — reads from `chrome.storage.local`; returns a default `BoardState` if key is absent.
  - `setBoardState(state: BoardState): Promise<void>` — writes the full state.
  - `clearBoardState(): Promise<void>` — deletes the stored state.
  - `STORAGE_KEY = 'altq_board_v1'` constant.
  - Default `BoardState`: `{ items: [], viewport: { x: 0, y: 0, zoom: 1 }, version: 1 }`.
- `src/background/background.ts` — on `runtime.onInstalled`, call `getBoardState()` and if `items` is empty, call `setBoardState(defaultState)` to initialize.
- `src/sidepanel/store/boardStore.ts` — Zustand store with:
  - State: `items: CanvasItem[]`, `viewport: ViewportState`, `isHydrated: boolean`.
  - Actions: `hydrate()`, `addItem()`, `updateItem()`, `deleteItem()`, `setViewport()`, `clearBoard()`.
- `src/sidepanel/hooks/useStorageSync.ts` — subscribes to the Zustand store and writes to storage on any change, debounced 300ms.
- `src/sidepanel/App.tsx` — calls `hydrate()` on mount; renders `null` until `isHydrated` is true (prevents flash of empty state on load).

### Key implementation notes

- `chrome.storage.local` is asynchronous — all reads/writes must be `await`ed or `.then()`-chained. Never use `localStorage` in the extension context.
- The `hydrate()` action must set `isHydrated = true` even if storage returns an empty state — it signals "we've checked storage, proceed to render".
- Use Zustand's `subscribeWithSelector` middleware to avoid re-running storage writes on every unrelated state change.
- The debounce in `useStorageSync` must be cancelled on unmount to prevent writes after the component tree tears down.
- Include a `version` field in `BoardState` for future schema migrations.

### Edge cases

- Storage quota exceeded: `setBoardState` should catch the error and surface it via a console warning in v1 (no UI for this yet).
- Concurrent writes: debouncing ensures only the latest state is written; intermediate states are not persisted.
- `chrome.storage.local` may return `undefined` for an unset key — the `getBoardState` default fallback must handle this.
- The background service worker and the side panel both access storage — they must use the same `STORAGE_KEY` constant.

### Tests to pass before moving to Phase 3

- [x] After installing the extension fresh, opening `chrome.storage.local` in the background service worker DevTools shows the key `altq_board_v1` with `{ items: [], viewport: { x: 0, y: 0, zoom: 1 }, version: 1 }`.
- [x] Opening the side panel triggers `hydrate()` — confirm via a temporary `console.log` in the Zustand store that `isHydrated` becomes `true`.
- [x] Calling `addItem()` in the Zustand store (via DevTools console: `window.__boardStore.getState().addItem(...)`) results in the item appearing in `chrome.storage.local` within ~400ms (debounce delay).
- [x] Closing and reopening the side panel, then calling `getBoardState()` returns the previously added item — persistence is verified.
- [x] Calling `clearBoard()` sets `items` to `[]` in both the Zustand store and `chrome.storage.local`.
- [x] Adding 50 items rapidly (via a loop in the console) results in exactly one `chrome.storage.local` write within 500ms of the last add (debounce is working — not 50 writes).
- [x] Manually setting `chrome.storage.local` to `{}` and reloading the extension (disable/enable) results in the default `BoardState` being re-initialized by the service worker.

---

## Phase 3 — Background Service Worker

### What to build

The service worker that handles context menu registration, tab capture, and the side panel toggle action.

### Deliverables

- `src/background/background.ts` (expanded):
  - On `runtime.onInstalled`: register two context menu items:
    - `"send-tab"` — `"Send tab to Alt+Q Board"`, contexts: `["action"]`.
    - `"send-selection"` — `"Send selection to Alt+Q Board"`, contexts: `["selection"]`.
  - `contextMenus.onClicked` handler:
    - For `"send-tab"`: read `tabs.query({ active: true, currentWindow: true })`, build a `CanvasItem` of type `"link"` with the tab's `title` and `url`, prepend it to `BoardState.items` at position `{ x: 40, y: 40 }` (offset by 20px per existing item count to avoid perfect stacking), write to storage.
    - For `"send-selection"`: build a `CanvasItem` of type `"snippet"` with `selectionText` and the tab's URL as `sourceUrl`, prepend to storage.
  - `action.onClicked` handler: toggle the side panel using `chrome.sidePanel.open({ windowId })` / detect open state via a boolean flag in the service worker's module scope.

### Key implementation notes

- Service workers in MV3 are ephemeral — do not rely on module-scope variables for persistent state. The open/close toggle flag must be read from storage or inferred from the panel state.
- `chrome.sidePanel` API: use `chrome.sidePanel.open({ windowId: tab.windowId })` to open. There is no official `isOpen` API in Chrome — maintain a flag in `chrome.storage.session` (not local) for toggle state.
- Context menus registered on `runtime.onInstalled` persist across service worker restarts — do not re-register on every activation.
- Use `chrome.tabs.query` with `{ active: true, currentWindow: true }` — always returns an array; take index `[0]`.

### Edge cases

- If the user right-clicks and selects "Send selection" but the service worker has been killed by Chrome (idle timeout), the context menu will still appear but `contextMenus.onClicked` will restart the worker — storage reads must be awaited properly.
- Sending a tab with a `chrome://` or `edge://` URL: the favicon API will fail. Fallback to a generic globe icon. Do not store `chrome://` URLs as link items (filter them out and show no-op behaviour).
- If `tabs.query` returns an empty array (edge case in some tab configurations), handle gracefully without throwing.

### Tests to pass before moving to Phase 4

- [x] Right-clicking any selected text on a webpage shows "Send selection to Alt+Q Board" in the context menu.
- [x] Selecting text and clicking "Send selection to Alt+Q Board" → opening `chrome.storage.local` shows a new `snippet` item with the selected text and the source URL.
- [x] Clicking the Alt+Q toolbar icon opens the side panel (if closed).
- [x] Clicking the Alt+Q toolbar icon again closes the side panel (if open).
- [x] After sending a tab via the action context menu (`"Send tab to Alt+Q Board"`): a `link` item with the correct `title` and `url` appears in storage.
- [x] Sending two items via context menu results in both items in `BoardState.items` (no overwrites).
- [x] Sending a `chrome://newtab` URL does nothing — no item is added to storage, no error is thrown.
- [x] Disabling and re-enabling the extension, then right-clicking a page still shows the context menu items (they are re-registered on `onInstalled`).

---

## Phase 4 — Side Panel Shell + Toolbar

### What to build

The visual shell of the side panel: the fixed toolbar at the top and the canvas area placeholder below it.

### Deliverables

- `src/sidepanel/components/Toolbar.tsx`:
  - Left: Alt+Q wordmark/logo in `Outfit` 600 weight.
  - Right: `+ Add tab` button (calls `addItem` with the current tab — via `chrome.tabs.query` from the side panel context), `⌨` shortcuts button (opens a modal — placeholder for now), `⋯` more menu (placeholder items: Export, Clear board, About).
  - Height: 48px. Background: `--toolbar-bg`. Bottom border: `1px solid var(--toolbar-border)`.
- `src/sidepanel/App.tsx`:
  - Layout: `flex-col h-screen`. Toolbar fixed at top (48px). Canvas area fills the rest (`flex-1 overflow-hidden`).
  - Renders `<Toolbar />` + `<Canvas />` (placeholder `<div>` for now).
- `src/sidepanel/components/Canvas.tsx` — placeholder: a `div` filling the canvas area with background `var(--canvas-bg)`.

### Key implementation notes

- The side panel's `<html>` and `<body>` must be `height: 100%; margin: 0` so the panel fills the Chrome side panel frame.
- `chrome.tabs.query` works from the side panel context — no message passing required to get the active tab.
- The `+ Add tab` button must be visually distinct (amber fill, `--font-sans`, `14px`).
- The `⋯` more menu should use a `<details>` / `<summary>` pattern or a small custom dropdown — no external menu library needed.
- The toolbar must not scroll — use `position: sticky; top: 0` or `flexShrink: 0`.

### Edge cases

- If the user resizes the side panel to its minimum width (280px), the toolbar must not overflow — use `gap` and `min-width: 0` with text truncation on the wordmark if needed.
- `+ Add tab` when the current tab is a `chrome://` page: button should be disabled (greyed out) with a tooltip "Cannot add this page".

### Tests to pass before moving to Phase 5

- [x] The side panel displays the toolbar at the top and a canvas area below. No scrollbar visible on the panel itself.
- [x] The Alt+Q wordmark is visible in `Outfit` font, 600 weight.
- [x] The `+ Add tab` button is visible and amber-colored.
- [x] Clicking `+ Add tab` on a regular webpage adds a `link` item to `chrome.storage.local` (verify in DevTools — no UI rendering yet).
- [x] The `⌨` shortcuts button is visible and clickable (placeholder modal or `alert()` acceptable for now).
- [x] The `⋯` more menu opens and shows at least "Export", "Clear board", "About" as menu items (non-functional is acceptable).
- [x] Resizing the side panel to ~280px wide: toolbar content does not overflow or wrap in a broken way.
- [x] On a `chrome://newtab` tab, the `+ Add tab` button is visually disabled.
- [x] The canvas area below the toolbar has the correct background color: `#F8F7F4` in light mode (verify via DevTools → Elements → Computed Styles → `background-color`).
- [x] Switching between browser tabs does not close or reset the side panel.

---

## Phase 5 — Canvas Infrastructure (Pan + Zoom)

### What to build

The infinite canvas: a CSS `transform`-based coordinate space with pointer-driven pan and scroll-wheel zoom, plus the recenter button.

### Deliverables

- `src/sidepanel/components/Canvas.tsx` (full implementation):
  - Outer div: `overflow: hidden`, fills panel minus toolbar, `cursor: default`, captures pointer events.
  - Inner div (`canvasEl`): `position: absolute; transform-origin: 0 0; transform: translate(Xpx, Ypx) scale(Z)`. All items will be children of this div.
  - Pan: on `pointerdown` on the outer div (not on a child item), set `isDragging = true`, record start coords. On `pointermove`, update `viewport.x/y`. On `pointerup`, stop.
  - Zoom: on `wheel` event, compute new scale clamped to `[0.25, 4.0]`, adjust `x/y` offset so zoom centers on the cursor position (standard zoom-to-cursor math).
  - Viewport state synced to Zustand `setViewport()` on every change.
- `src/sidepanel/hooks/useCanvasPan.ts` — pointer event logic extracted into a hook.
- `src/sidepanel/hooks/useCanvasZoom.ts` — wheel event logic extracted into a hook.
- `src/sidepanel/components/RecenterButton.tsx`:
  - Fixed to bottom-right of the canvas area.
  - Label: "⌖ Recenter".
  - On click: computes bounding box of all items, animates `viewport` to fit them in view with 40px padding.
  - Hidden when `items.length === 0`.
- Zoom indicator badge: fixed bottom-right (above Recenter button). Shows `"100%"`. Clicking resets zoom to `1.0` without changing pan. Uses `Geist Mono` font.
- `Space + drag` for alternate pan: when `space` is held, dragging the canvas (even over items) pans instead of selecting.

### Key implementation notes

- **Zoom-to-cursor math:**
  ```
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = clamp(viewport.zoom * zoomFactor, 0.25, 4.0);
  const ratio = newZoom / viewport.zoom;
  const newX = e.clientX - ratio * (e.clientX - viewport.x);
  const newY = e.clientY - ratio * (e.clientY - viewport.y);
  ```
  Apply this exactly — incorrect math causes the canvas to drift away from the cursor on zoom.
- Use `e.preventDefault()` on the `wheel` event to prevent the side panel itself from scrolling.
- Apply `will-change: transform` to `canvasEl` to hint GPU compositing.
- The recenter animation: update `viewport` in a single `setViewport` call; CSS `transition: transform 250ms ease-in-out` on `canvasEl` handles the animation. Remove the transition class immediately after (`transitionend` event) so drag is not affected.
- Pan must not trigger when `pointerdown` originated on a child item — check `e.target === outerDiv` or use a `data-canvas-bg` attribute on the background element.

### Edge cases

- Mouse wheel on a Mac touchpad fires rapid events — the clamp ensures zoom never exceeds bounds even with fast scrolling.
- If `items` is empty, the Recenter button is hidden and `Ctrl+Shift+H` does nothing.
- At zoom < 0.5, the zoom indicator should show the percentage in red or amber to warn the user they are zoomed far out.
- Side panel resize (user drags the panel width): the canvas outer div changes size but `viewport` coordinates remain the same — items stay in their saved positions correctly.

### Tests to pass before moving to Phase 6

- [x] Clicking and dragging the canvas background pans the canvas (the coordinate origin visibly moves).
- [x] The cursor changes to `grab` when hovering the background and `grabbing` while dragging.
- [x] Scrolling the mouse wheel zooms in and out, centered on the cursor position (items near cursor stay under cursor).
- [x] Zoom does not go below 25% (`0.25`) or above 400% (`4.0`) regardless of scroll speed.
- [x] The zoom level indicator (bottom-right) shows the current zoom percentage in `Geist Mono` font and updates live.
- [x] Clicking the zoom indicator resets zoom to 100% without changing the pan position.
- [x] Closing and reopening the side panel: the previous viewport (pan position + zoom level) is restored.
- [x] The "⌖ Recenter" button is not visible when the board is empty.
- [x] Place a temporary item (directly in Zustand store via DevTools console), pan far away, then click "⌖ Recenter" — the viewport animates to frame the item with visible padding.
- [x] `Alt+C` keyboard shortcut triggers recenter (changed from Ctrl+Shift+H per user preference).
- [x] Holding `Space` and dragging anywhere on the canvas (including over items) pans the canvas.
- [x] Panning and zooming feel smooth at 60fps. Open DevTools → Performance, record 3 seconds of active panning — verify no "Long Task" blocks > 16ms on the main thread.

---

## Phase 6 — Context Menu (Add Content)

### What to build

The floating mini-menu that appears when the user clicks on empty canvas space, offering Text, Link, and Paste options.

### Deliverables

- `src/sidepanel/components/ContextMenu.tsx`:
  - Rendered as a fixed-position element (`position: fixed` in the DOM, coordinates in viewport space).
  - Three rows: **T Text**, **🔗 Link**, **📋 Paste**.
  - Paste row is greyed out (`opacity: 0.4`, `cursor: not-allowed`) if the clipboard is empty or inaccessible.
  - Appearance animation: `scale(0.95) opacity(0) → scale(1) opacity(1)`, `80ms ease-out`.
  - Dismisses on: `Escape` key, click outside the menu, or selection of an action.
- Canvas click handler in `Canvas.tsx`:
  - `onPointerDown` on background: record click position in canvas coordinate space.
  - `onPointerUp` on background (same target, delta < 4px): open context menu at `(e.clientX, e.clientY)`.
  - If delta ≥ 4px: treat as pan (not a click).
- Clipboard detection: `navigator.clipboard.readText()` called on menu open. If it resolves with a non-empty string, Paste is enabled. If the permission is denied or the clipboard is empty, Paste is greyed out.
- Canvas-space coordinates: when the user selects an action, compute the canvas-space position from the click's viewport coordinates using the inverse of the current viewport transform:
  ```
  const canvasX = (clientX - viewport.x) / viewport.zoom;
  const canvasY = (clientY - viewport.y) / viewport.zoom;
  ```
  Store this as the new item's `x` and `y`.

### Key implementation notes

- The context menu must not open when the user was panning (pointer moved > 4px between down and up).
- The context menu must not open when the pointerdown target was an item (only on the canvas background).
- Use `position: fixed` so the menu is not affected by the canvas transform.
- The menu must stay within the viewport bounds — if it would render off the right/bottom edge, flip its anchor point.
- Pressing `Escape` while the menu is open must close it without triggering any canvas action.

### Edge cases

- Clipboard read may trigger a browser permission prompt — this is acceptable for v1. If the permission is permanently denied, Paste is permanently greyed out.
- Very fast double-click on the canvas should not open two menus — debounce or ignore second click if menu is already open.
- If the user's display is very small (narrow side panel), the menu must not clip outside the panel frame — apply `max-width: 180px` and ensure it stays within panel bounds.

### Tests to pass before moving to Phase 7

- [x] Single-clicking on empty canvas space opens the context menu near the click point.
- [x] The menu contains exactly three items: "T Text", "🔗 Link", "📋 Paste".
- [x] The menu appears with a subtle scale-in animation (not instant).
- [x] Pressing `Escape` closes the menu without any other action.
- [x] Clicking outside the menu (on the canvas) closes it without opening a new one.
- [x] Clicking while dragging (pan gesture) does NOT open the menu.
- [x] The menu does not appear when clicking on a child item (not yet implemented — verify by temporarily placing a `<div>` child in the canvas).
- [x] When the clipboard contains text, "📋 Paste" is enabled (not greyed out).
- [x] When the clipboard is empty or permission denied, "📋 Paste" is visually greyed out and unclickable.
- [x] At a zoom level of 50%, clicking the canvas at a visible position opens the menu — and the canvas-space coordinates logged (temporary `console.log`) correctly account for the zoom (`canvasX = (clientX - viewport.x) / 0.5`).
- [x] The menu never clips outside the side panel frame, even when clicking near the right or bottom edge.

---

## Phase 7 — Text Items

### What to build

The core content primitive: a floating text block that can be placed on the canvas, edited inline with basic rich text, dragged to any position, and deleted.

### Deliverables

- `src/sidepanel/components/CanvasItem.tsx` — generic item renderer that switches on `item.type`.
- `src/sidepanel/components/items/TextItem.tsx`:
  - Renders at `position: absolute; left: item.x; top: item.y` inside `canvasEl`.
  - Width: `240px`. Height: auto (grows with content).
  - At rest: no background, no border. Text renders directly on the canvas.
  - On hover: `background: var(--item-hover-bg)`, `border-radius: 8px`, `padding: 8px`. Transition `120ms ease`.
  - When selected: faint amber ring (`box-shadow: 0 0 0 2px var(--item-selected-ring)`).
  - Font: `Outfit`, `16px`, `--text-primary`.
- `src/sidepanel/components/RichTextEditor.tsx`:
  - Tiptap instance with extensions: `Document`, `Paragraph`, `Text`, `Bold`, `Italic`, `Code`.
  - No toolbar by default — formatting via keyboard shortcuts only (`Cmd/Ctrl+B`, `Cmd/Ctrl+I`, `` Cmd/Ctrl+` ``).
  - A minimal floating toolbar (three icon buttons: **B**, _I_, `</>`) appears when text is selected (use Tiptap's `BubbleMenu`).
  - On `blur`: if the editor content is empty (no text), dispatch `deleteItem(id)` — auto-remove empty items.
  - On `blur` (non-empty): dispatch `updateItem` with the latest `RichTextNode[]` content.
  - `Geist Mono` applied to code marks via a CSS rule targeting `.ProseMirror code`.
- `src/sidepanel/hooks/useDrag.ts`:
  - Accepts `id`, current `x/y`, `zoom` level.
  - On `pointerdown` on the item: set `isDragging = true`, capture pointer, record offset.
  - On `pointermove`: compute new `x/y` in canvas coordinates, dispatch `updateItem` with new position.
  - On `pointerup`: release pointer capture, stop drag. Final position is already in the store.
  - Must call `e.stopPropagation()` on `pointerdown` so the canvas pan handler does not fire.
- Context menu "T Text" action: creates a `CanvasItem` via `addItem({ type: 'text', x: canvasX, y: canvasY, content: [], width: 240 })` and immediately enters edit mode on the new item.
- `boardStore.ts` — wire up `addItem` to generate a UUID, set `createdAt`/`updatedAt`, and append to `items`.

### Key implementation notes

- Edit mode is tracked in local React state (`isEditing`), not in the global store — it's ephemeral UI state.
- When entering edit mode, set `pointer-events: none` on the canvas background to prevent accidental canvas clicks triggering the context menu.
- The Tiptap editor's JSON output must be mapped to `RichTextNode[]` before storing (keep the serialization logic in a helper in `lib/tiptap.ts`).
- `useDrag` must work correctly at any zoom level — all position deltas must be divided by `viewport.zoom`.
- Do not apply the hover ghost style when the item is in edit mode — it looks cluttered.

### Edge cases

- Pasting into the Tiptap editor: Tiptap will strip HTML by default with the basic extensions. Verify that pasting from a rich webpage does not inject raw HTML markup into the item.
- Very long single words (no spaces) must break with `overflow-wrap: break-word` so the item does not overflow its 240px width.
- Dragging an item to a negative canvas coordinate (x < 0 or y < 0) is allowed — the canvas is infinite. Do not clamp.
- Clicking a text item when NOT in edit mode should select it, not enter edit mode. Double-click or clicking the edit action enters edit mode.
- On Firefox (if tested): `pointer-events` and `BubbleMenu` positioning may differ — note as a known v1 limitation.

### Tests to pass before moving to Phase 8

- [x] Clicking empty canvas → "T Text" creates a text item at the click position and immediately focuses the cursor inside it.
- [x] Typing text in the editor renders it visually on the canvas with `Outfit` font.
- [x] `Cmd/Ctrl+B` on selected text renders it bold.
- [x] `Cmd/Ctrl+I` on selected text renders it italic.
- [x] `` Cmd/Ctrl+` `` on selected text renders it as inline code using `Geist Mono`.
- [x] Selecting text in the editor causes the floating toolbar (B / I / `</>`) to appear.
- [x] Clicking outside the item while it has text saves the content (verify by closing and reopening the panel — content persists).
- [x] Creating an item and immediately clicking outside (no text entered) removes the item automatically.
- [x] Single-clicking a resting text item selects it (amber ring appears).
- [x] Dragging a selected item to a new position moves it in real time and saves the new position.
- [x] Dragging at 50% zoom moves the item at the correct rate (drag 100px on screen = item moves 200px in canvas space).
- [x] The hover ghost background appears on hover but not while editing.
- [x] A text item with very long content wraps correctly within 240px and does not overflow the item width.
- [x] Pasting plain text from the clipboard into the editor inserts it as plain text (no HTML tags).
- [x] Closing and reopening the side panel: all text items appear at their saved positions with their saved content.

---

## Phase 8 — Link Items

### What to build

Link items that display a favicon and resolved page title as floating content on the canvas, with click-to-open behaviour.

### Deliverables

- `src/sidepanel/lib/favicon.ts`:
  - `getFaviconUrl(url: string): string` — returns `https://www.google.com/s2/favicons?domain={domain}&sz=32`.
  - Extracts domain from the URL using `new URL(url).hostname`.
  - Returns a fallback SVG data URI (generic link icon) if the URL is invalid.
- `src/sidepanel/components/items/LinkItem.tsx`:
  - Renders at absolute canvas position.
  - Content: `<img src={faviconUrl} width={16} height={16} />` + title text, inline on one line.
  - Width: `240px`. Title truncates with `text-overflow: ellipsis` if too long.
  - Title color: `var(--accent)` (`#F59E0B`).
  - Font: `Outfit`, `14px`.
  - At rest: no background/border (same pattern as text items).
  - On hover: ghost background appears + a `↗` icon fades in at the right edge + a tooltip showing the full URL in `Geist Mono`, `11px`.
  - On click (single, not drag): opens the URL in a new tab via `chrome.tabs.create({ url })`.
- `boardStore.ts` — `addItem` creates a link item with `title`, `url`, `favicon` fields.
- Context menu "🔗 Link" action: places a link item at canvas position, with an inline URL input field rendered in place of the title. On `Enter` / `blur`: resolve the favicon, store the URL as the title (until title fetching is implemented — see edge cases), close editing.
- `+ Add tab` toolbar button: gets the current tab via `chrome.tabs.query`, creates a link item with the tab's `title`, `url`, and favicon.
- When an item is sent from the background service worker (Phase 3) and the side panel is open: the side panel must subscribe to `chrome.storage.onChanged` to pick up new items added externally.

### Key implementation notes

- `chrome.storage.onChanged` listener must be added in the side panel's `useStorageSync` hook to detect external writes (from the background service worker). On change, merge new items into the Zustand store.
- Page title fetching from URL is not feasible without a content script or network request — for links added via the "🔗 Link" context menu action, use the URL's hostname as the title until the user edits it. For links added via `+ Add tab`, use the actual tab `title`.
- Favicon images may fail to load (404) — add `onError` handler to the `<img>` that swaps in the fallback SVG.
- Do not call `chrome.tabs.create` during a `pointerdown` event — use `pointerup` with a movement check (< 4px delta) to distinguish click from drag.

### Edge cases

- URL entered in the "🔗 Link" inline input without a protocol (`example.com`) — prepend `https://` automatically.
- Very long URLs or titles: ellipsis truncation must work correctly — test with a 200-character title.
- If the user pastes a non-URL string into the link input, show a small inline error ("Not a valid URL") and do not create the item.
- Favicons for `localhost` URLs will fail — fallback icon shown.
- Multiple items added via context menu while the panel is closed: on next panel open, all items should appear (batched from storage).

### Tests to pass before moving to Phase 9

- [x] Clicking canvas → "🔗 Link" shows an inline URL input at the canvas position.
- [x] Typing `https://github.com` and pressing `Enter` creates a link item with the GitHub favicon and hostname "github.com" as the title.
- [x] Typing `github.com` (no protocol) and pressing `Enter` creates a valid link item (protocol auto-prepended).
- [x] Entering a non-URL string in the link input shows a "Not a valid URL" error and does not create an item.
- [x] Clicking a link item opens the URL in a new tab. _(UX change: single click now selects; "Open ↗" button in the selection bubble opens the URL — intentional to allow drag without navigation)_
- [x] Hovering a link item shows the `↗` icon and a tooltip with the full URL in `Geist Mono`.
- [x] Hovering a link item shows the ghost background.
- [x] Clicking `+ Add tab` creates a link item with the correct page title and favicon of the active tab.
- [x] If the favicon image fails to load (test with a fake URL), the fallback generic icon is shown.
- [x] Sending a tab via right-click context menu ("Send tab to Alt+Q Board") while the panel is open: the link item appears in the panel within 1 second without requiring a panel reload.
- [x] A link item can be dragged to a new position (same behaviour as text items).
- [x] Closing and reopening the side panel: link items appear at their saved positions with correct favicons and titles.

---

## Phase 9 — Snippet Items

### What to build

Items created from right-click selected text on a webpage, with source attribution shown on hover.

### Deliverables

- `src/sidepanel/components/items/SnippetItem.tsx`:
  - Renders like a text item but with a source attribution line below the content.
  - Attribution: "from: {hostname}" in `Outfit`, `11px`, `--text-muted` color, visible only on hover.
  - Content is editable inline (same Tiptap setup as `TextItem` but without formatting toolbar — plain text only for snippets in v1).
- `boardStore.ts` — `addItem` handles `type: 'snippet'` with `content`, `sourceUrl` fields.
- Background service worker (Phase 3) already writes snippet items to storage. Ensure the side panel's `chrome.storage.onChanged` listener handles them.
- Context menu `"send-selection"` handler (Phase 3): the `selectionText` from `contextMenus.onClicked` info is stored as a single `RichTextNode` with no formatting marks.

### Key implementation notes

- Snippets added while the panel is closed should appear correctly when the panel is next opened (hydrated from storage).
- The source URL is stored but never linked (not clickable in v1) — it's metadata for context only.
- Snippet items are visually identical to text items at rest — only the hover attribution distinguishes them.

### Edge cases

- Very long selected text (> 500 characters): store the full text but display a `max-height` with `overflow: hidden` at `200px`. A "show more" toggle is out of scope for v1 — simply truncate visually.
- HTML in `selectionText`: `contextMenus.onClicked` provides plain text — no sanitization needed. But confirm in testing that rich selections (tables, formatted text) come through as plain text.
- Selecting text across multiple elements (e.g., part of a heading and part of a paragraph): `selectionText` concatenates them — this is expected behaviour.

### Tests to pass before moving to Phase 10

- [x] Selecting text on a webpage → right-click → "Send selection to Alt+Q Board" creates a snippet item in storage.
- [x] Opening the side panel after sending a selection: the snippet item appears at the default position with the selected text content. _(Uses sentinel position → repositioned to viewport center with flash animation on open)_
- [ ] Hovering the snippet item shows the "from: {hostname}" attribution in muted small text. _(Not done — snippets currently render as TextItem, no attribution)_
- [ ] The attribution is NOT visible at rest (only on hover). _(Not done)_
- [x] The snippet item can be dragged to a new position.
- [x] Sending a snippet while the panel is open: the item appears in the panel without requiring a reload.
- [ ] A snippet with > 500 characters is visually capped at 200px height (content truncated with overflow hidden). _(Not done)_
- [x] Closing and reopening the panel: snippet items persist with their content and source URL.
- [x] Sending a selection from a page with special characters (e.g., `"quotes"`, `<tags>`, `& ampersands`) stores and displays them correctly (no HTML entity escaping issues).

---

## Phase 10 — Item Selection + Action Bar

### What to build

The selection model (single and multi-select) and the hover/select action bar with Edit, Copy, Duplicate, and Delete actions.

### Deliverables

- Selection state in Zustand: `selectedIds: Set<string>`. Actions: `select(id)`, `multiSelect(id)`, `clearSelection()`, `selectAll()`.
- `CanvasItem.tsx` — apply selected ring style when `selectedIds.has(item.id)`.
- `src/sidepanel/components/ActionBar.tsx`:
  - Renders as a small floating bar (`position: absolute`, placed above the item in canvas space).
  - Visible when an item is hovered OR selected.
  - Four icon buttons: ✏️ Edit, 📋 Copy, ⧉ Duplicate, 🗑 Delete.
  - Font for labels: `Outfit`, `11px`.
  - Background: `--panel-bg` with `border-radius: 6px`, subtle shadow.
- Action implementations:
  - **Edit:** sets `isEditing = true` on the item (via a callback passed down from `CanvasItem`).
  - **Copy:** `navigator.clipboard.writeText(plainTextContent)` for text/snippet; `navigator.clipboard.writeText(url)` for link items.
  - **Duplicate:** creates a new `CanvasItem` with the same content, offset by `+20px, +20px`, new UUID, new timestamps.
  - **Delete:** dispatches `deleteItem(id)` and pushes to the undo stack.
- Multi-select: `Shift+click` adds to selection. Dragging any selected item moves all selected items together (apply the same `dx, dy` delta to all).
- Click on empty canvas while items are selected: `clearSelection()`.
- `Delete` / `Backspace` key (when not in edit mode): deletes all selected items.
- `Cmd/Ctrl+D`: duplicates all selected items.

### Key implementation notes

- The action bar must use canvas-space positioning (transformed by the viewport) so it stays above the item during pan/zoom. Place it as a sibling inside `canvasEl`.
- Show the action bar on hover via CSS + a React state flag — do not show it during active drag.
- Multi-item drag: record each selected item's starting position on `pointerdown`, apply the same `dx/dy` to all on `pointermove`.
- The `isEditing` state for a specific item must hide the action bar for that item (to avoid overlap with the Tiptap BubbleMenu).
- `Copy` action: for text items, serialize `RichTextNode[]` to plain text (strip formatting marks, just concatenate `.text` fields).

### Edge cases

- Shift+clicking an already-selected item should deselect it (toggle behaviour).
- `Delete` key pressed while a text item is in edit mode should delete characters, not the item.
- Duplicating a link item must copy the favicon URL and title correctly.
- Multi-selecting 10+ items and deleting: a single undo action should restore all of them.
- The action bar must not overlap the BubbleMenu (formatting toolbar) when text is selected inside an item — hide the action bar when `isEditing` is true.

### Tests to pass before moving to Phase 11

- [x] Single-clicking a resting item selects it (amber ring visible).
- [x] Clicking empty canvas clears the selection (amber ring disappears).
- [ ] Shift+clicking a second item adds it to the selection (two amber rings visible). _(Not done — single selection only)_
- [ ] Shift+clicking an already-selected item deselects it. _(Not done)_
- [x] The action bar appears when an item is hovered (with no selection). _(Implemented as per-item bubble menu on hover/select)_
- [x] The action bar appears when an item is selected.
- [x] The action bar disappears while an item is being dragged.
- [x] Clicking ✏️ Edit in the action bar enters inline edit mode on the item.
- [x] Clicking 📋 Copy on a text item copies its plain text content to the clipboard.
- [ ] Clicking 📋 Copy on a link item copies the URL to the clipboard. _(Not done — link bubble has Open/Delete, no Copy)_
- [ ] Clicking ⧉ Duplicate creates a copy of the item offset by 20px. _(Not done)_
- [x] Clicking 🗑 Delete removes the item from the canvas.
- [x] Pressing `Delete` / `Backspace` with an item selected (not in edit mode) removes it.
- [x] Pressing `Delete` while in text edit mode deletes characters, not the item.
- [ ] Selecting two items and dragging one: both items move together with the same delta. _(Not done — no multi-select)_
- [ ] `Cmd/Ctrl+D` duplicates all selected items. _(Not done)_

---

## Phase 11 — Undo

### What to build

An in-memory undo stack for destructive actions (item delete, clear board), surfaced via a toast notification.

### Deliverables

- `src/sidepanel/lib/undo.ts`:
  - `UndoStack` — array of `UndoEntry` objects: `{ description: string, restore: () => void }`.
  - Max 20 entries. LIFO pop on undo.
- `boardStore.ts` — integrate undo:
  - `deleteItem(id)`: pushes `{ description: "Deleted item", restore: () => addItem(snapshot) }` before deleting.
  - `deleteItems(ids)`: pushes a single entry that restores all deleted items.
  - `clearBoard()`: pushes an entry that restores the full item list.
  - `undo()`: pops the top entry and calls `restore()`.
- `src/sidepanel/components/UndoToast.tsx`:
  - Appears at the bottom-right of the canvas area (above zoom indicator).
  - Content: `"Item deleted"` + **Undo** button.
  - Auto-dismisses after 3 seconds. Dismisses immediately if `Undo` is clicked or another undo-eligible action occurs.
  - Slide-in animation from the right.
- `Cmd/Ctrl+Z` keyboard shortcut: calls `undo()`.

### Key implementation notes

- The undo stack is NOT persisted to `chrome.storage.local` — it is in-memory only and resets on panel close.
- The `restore` function must capture a deep clone of the deleted items, not a reference — use `structuredClone()`.
- Only destructive actions get undo entries: delete and clear. Move and edit do not get undo in v1.
- The toast should replace itself (not stack) if multiple deletions happen in quick succession.

### Edge cases

- Undoing after the panel has been closed and reopened is not possible (stack is cleared) — this is expected v1 behaviour.
- Undo after `clearBoard()` restores all items with their last-saved positions.
- Calling undo when the stack is empty: no-op (no error, no toast).

### Tests to pass before moving to Phase 12

- [ ] Deleting an item shows the "Item deleted — Undo" toast in the bottom-right.
- [ ] Clicking **Undo** in the toast within 3 seconds restores the deleted item at its original position.
- [ ] `Cmd/Ctrl+Z` also restores the deleted item.
- [ ] The toast auto-dismisses after 3 seconds if not acted on.
- [ ] Deleting 3 items in sequence: `Cmd/Ctrl+Z` three times restores them in reverse order.
- [ ] After 20 undos, the oldest entry is dropped (21st undo does nothing).
- [ ] Clearing the board ("Clear board" in the `⋯` menu) shows a toast and can be undone.
- [ ] Closing and reopening the panel clears the undo stack — `Cmd/Ctrl+Z` does nothing after panel reopen.

---

## Phase 12 — Empty State + Onboarding

### What to build

The animated welcome state shown on first launch (and after clearing the board).

### Deliverables

- `src/sidepanel/components/EmptyState.tsx`:
  - Centered in the canvas area (using `position: absolute; inset: 0; display: flex; align-items: center; justify-content: center` — inside the canvas coordinate space, positioned at the initial viewport center).
  - **Heading:** "Your board is empty." — `Outfit`, `18px`, `600` weight, `--text-secondary`.
  - **Sub-line:** "Click anywhere to start, or add your current tab." — `Outfit`, `14px`, `--text-muted`.
  - **Hint chips:** Three pill buttons: `[ Click anywhere ]`, `[ Paste a link ]`, `[ Alt+Q ]` — ghost style, amber border, `Outfit`, `13px`. Non-interactive (visual only).
  - Fade-in animation on mount: `opacity 0 → 1`, `300ms ease`.
  - Fade-out when first item is added: `opacity 1 → 0`, `200ms ease`, then unmounted.
- Show condition: `items.length === 0`. Once any item is added, the empty state unmounts and does not return even if that item is later deleted (use a `hasEverHadItems` flag in local component state, not store).
  - **Exception:** after `clearBoard()`, the empty state re-appears (reset `hasEverHadItems`).

### Key implementation notes

- The empty state is positioned in canvas space, not fixed to the viewport — it pans with the canvas. Position it at `(0, 0)` in canvas coordinates so it is visible at the initial viewport.
- If the user pans far away and the canvas is empty, the empty state may not be visible. This is acceptable — the "⌖ Recenter" button handles navigation.

### Edge cases

- If items are loaded from storage on hydration (returning user), the empty state must never appear — check `items.length` after hydration, not before.
- Undo after deleting the last item: the item is restored but `hasEverHadItems` remains true — empty state does not reappear.

### Tests to pass before moving to Phase 13

- [ ] On fresh install (empty storage), opening the side panel shows the empty state with heading, sub-line, and three hint chips.
- [ ] The empty state fades in smoothly (not instant).
- [ ] Adding a text item (clicking canvas → Text) causes the empty state to fade out and disappear.
- [ ] Once the empty state disappears, deleting the item does NOT bring the empty state back.
- [ ] Clicking "Clear board" from the `⋯` menu causes the empty state to reappear.
- [ ] A returning user (items in storage): opening the panel shows their items, never the empty state.
- [ ] The heading uses `Outfit` `18px` `600` weight (verify in DevTools Computed Styles).
- [ ] The hint chips are visually styled with an amber ghost border.

---

## Phase 13 — Keyboard Shortcuts

### What to build

The complete keyboard shortcut system and the shortcuts reference modal.

### Deliverables

- `src/sidepanel/hooks/useKeyboardShortcuts.ts`:
  - Global `keydown` listener attached to the side panel `document`.
  - Handles all shortcuts listed in the PRD:
    - `Escape`: close context menu OR exit edit mode OR deselect all (in priority order).
    - `Delete` / `Backspace` (not editing): delete selected items.
    - `Cmd/Ctrl+Z`: undo.
    - `Cmd/Ctrl+D`: duplicate selected.
    - `Cmd/Ctrl+C`: copy selected item content.
    - `Cmd/Ctrl+0`: reset zoom to 100%.
    - `Cmd/Ctrl+Shift+H`: recenter viewport.
    - `Space` (held): activate pan mode.
- `src/sidepanel/components/ShortcutsModal.tsx`:
  - Triggered by the `⌨` toolbar button.
  - Modal overlay with a table of all shortcuts.
  - Uses `Outfit` for labels, `Geist Mono` for the key names (e.g., `Ctrl+B`).
  - Closes on `Escape` or clicking the overlay.

### Key implementation notes

- Guard every shortcut handler: check that the target element is not an `<input>`, `<textarea>`, or a Tiptap editor (`[contenteditable]`) before acting — except for shortcuts that are explicitly intended to work inside editors (Tiptap handles `Cmd+B` itself).
- Use `e.preventDefault()` for shortcuts that have browser-native behaviour (e.g., `Cmd+D` would bookmark the page without it).
- `Space` pan mode: on `keydown` Space, set a `isPanMode` flag; on `keyup` Space, clear it. In `Canvas.tsx`, read `isPanMode` to decide whether pointer events pan or select.

### Edge cases

- On Windows, `Ctrl+Z` is undo; on Mac, `Cmd+Z`. Handle both: check `e.metaKey || e.ctrlKey`.
- `Cmd+C` inside a text editor should copy selected text (browser default) not the item URL — do not override `Cmd+C` when `contenteditable` is focused.
- If no items are selected, `Delete` / `Cmd+D` / `Cmd+C` are no-ops.

### Tests to pass before moving to Phase 14

- [x] `Escape` closes the context menu when it is open.
- [x] `Escape` exits item edit mode when an item is being edited.
- [x] `Escape` clears selection when no menu is open and no item is in edit mode.
- [x] `Delete` with a text item selected (not editing) removes the item.
- [x] `Delete` inside a text editor (editing mode) deletes characters, not the item.
- [ ] `Cmd/Ctrl+Z` undoes the last delete. _(Not done — undo not implemented)_
- [ ] `Cmd/Ctrl+D` duplicates all selected items. _(Not done)_
- [ ] `Cmd/Ctrl+0` resets zoom to 100%. _(Not done via keyboard; clicking the zoom % badge does reset zoom)_
- [ ] `Cmd/Ctrl+Shift+H` recenters the viewport. _(Changed to `Alt+C` per user preference)_
- [x] Holding `Space` while dragging the canvas pans even when the pointer is over an item.
- [x] Clicking the `⌨` toolbar button opens the shortcuts modal.
- [x] The shortcuts modal lists all keyboard shortcuts with key names in `Geist Mono`.
- [x] `Escape` closes the shortcuts modal.
- [x] All `Cmd` shortcuts work on Mac; all `Ctrl` shortcuts work on Windows (test on both if available).

---

## Phase 14 — "Paste" Action + Clipboard

### What to build

The "📋 Paste" option in the context menu: intelligently creates a link item or text item based on clipboard content.

### Deliverables

- `src/sidepanel/lib/clipboard.ts`:
  - `readClipboard(): Promise<string | null>` — reads `navigator.clipboard.readText()`, returns null on failure.
  - `isValidUrl(text: string): boolean` — uses `new URL(text)` in a try/catch; returns true for valid `http(s)://` URLs.
- Context menu "📋 Paste" handler in `Canvas.tsx`:
  - Reads clipboard.
  - If URL: creates a link item at canvas position with the URL as title and computed favicon.
  - If plain text: creates a text item at canvas position with the clipboard text as content.
  - If null/empty: no-op (button should have been disabled — defensive check).

### Edge cases

- Clipboard contains a URL without a protocol (`example.com`): treat as plain text, not a link.
- Clipboard contains multiline text: create a text item with all lines preserved.
- Clipboard permission denied: show a brief error toast "Clipboard access denied — paste manually."

### Tests to pass before moving to Phase 15

- [x] With a valid URL in the clipboard (`https://example.com`), clicking canvas → Paste creates a link item.
- [x] With plain text in the clipboard, clicking canvas → Paste creates a text item with the clipboard content.
- [x] With `example.com` (no protocol) in the clipboard, Paste creates a text item (not a link item).
- [x] With an empty clipboard, the Paste option in the context menu is visually greyed out and unclickable.
- [ ] With clipboard permission denied, clicking Paste shows a brief error toast. _(Not done — no toast system yet)_

---

## Phase 15 — Visual Polish + Design System

### What to build

Final visual pass: motion, spacing, dark mode, and design token consistency across all components.

### Deliverables

- Verify all CSS variables from the design system are applied consistently:
  - `--canvas-bg`, `--panel-bg`, `--toolbar-bg`, `--toolbar-border` in their respective components.
  - `--accent`, `--accent-hover`, `--accent-subtle` for buttons, link titles, selected rings.
  - `--text-primary`, `--text-secondary`, `--text-muted` on all text elements.
  - `--item-hover-bg`, `--item-selected-ring` on canvas items.
- Dark mode: all tokens resolve to their dark values when `prefers-color-scheme: dark`. Verify via Chrome DevTools → Rendering → Emulate CSS media feature.
- All transitions from the design system applied:
  - Item hover ghost: `120ms ease`.
  - Context menu appear: `scale + opacity 80ms ease-out`.
  - Recenter animation: `250ms ease-in-out`.
  - Undo toast slide-in.
- Toolbar buttons: hover state (`--accent-subtle` background), active state (slightly darker), `border-radius: 6px`.
- Action bar: refined shadow and spacing.
- Font rendering: confirm `Outfit` and `Geist Mono` render at pixel-perfect sizes across all item types, the toolbar, the shortcuts modal, and the zoom indicator.
- Zoom indicator: `Geist Mono`, appears below Recenter button, fixed to bottom-right of the canvas viewport.

### Tests to pass before moving to Phase 16

- [x] Enable "Emulate CSS media feature prefers-color-scheme: dark" in Chrome DevTools. The canvas background changes to `#141414`, the toolbar to `#1C1C1C`, and all text becomes light-colored.
- [x] In dark mode, the amber accent color is `#FBBF24` (slightly lighter than light mode `#F59E0B`) — verify via DevTools Computed Styles on a link item title.
- [x] Hovering a text item: the ghost background fades in over ~120ms (not instant).
- [x] The context menu appears with a scale-up animation (~80ms), not instant.
- [x] The "⌖ Recenter" animation takes ~250ms and has an ease-in-out feel (not linear).
- [ ] All toolbar buttons show a hover background on mouse-over. _(Not done — toolbar icon buttons lack explicit hover styles)_
- [x] The zoom indicator is in `Geist Mono` font (verify via DevTools → Elements → Computed → font-family).
- [ ] All item body text is in `Outfit` font.
- [ ] No layout shift occurs when `Outfit` or `Geist Mono` load (fonts are subsetted and declared with `font-display: swap`).
- [ ] The side panel has no horizontal scrollbar at any width between 280px and 600px.
- [ ] Inspect all components in both light and dark mode — no hardcoded hex colors remain in component files (all reference CSS variables).

---

## Phase 16 — Final QA + Store Readiness

### What to build

End-to-end validation of all flows, manifest metadata, extension icons, and store listing prerequisites.

### Deliverables

- Extension icons: `icons/16.png`, `32.png`, `48.png`, `128.png` — clean Alt+Q mark on a transparent or solid background.
- `manifest.json`: correct `name`, `description` (max 132 chars), `version: "1.0.0"`, `icons`.
- Privacy policy URL (can be a placeholder GitHub Pages page for the initial submission).
- `README.md`: build instructions, development setup, and a note about the hot-reload caveat.
- Performance check: profile the panel with 200 items loaded.

### Tests to pass (ship criteria)

#### Full flow tests

- [ ] Fresh install → open panel → empty state shown → click canvas → add text item → close panel → reopen panel → item persists.
- [ ] Add current tab as link → click link item → correct URL opens in new tab.
- [ ] Select text on a webpage → right-click → Send selection → open panel → snippet visible with source attribution.
- [ ] Add 10 items, pan and zoom, close panel, reopen — viewport position and all items restored exactly.
- [ ] Delete an item → Undo → item restored → close panel → reopen → item still there.
- [ ] Clear board → empty state re-appears → add item → empty state gone.

#### Performance tests

- [ ] Load 200 text items into storage (via DevTools console `setBoardState`). Open the panel — all items render in under 150ms (measure via DevTools → Performance → LCP or manual stopwatch).
- [ ] With 200 items, drag one item. No visible lag or jank. DevTools → Performance shows no main-thread blocks > 16ms during drag.
- [ ] With 200 items, scroll the mouse wheel to zoom. Animation is smooth (60fps).

#### Security and manifest tests

- [ ] `chrome://extensions` shows no errors or warnings on the extension card.
- [ ] The extension does not request any permissions not listed in the PRD (check the `manifest.json` permissions array).
- [ ] Pasting `<script>alert(1)</script>` into a text item renders it as literal text, not executed HTML.
- [ ] Pasting a URL containing `javascript:alert(1)` into the link input: the item is not created (invalid URL protocol filtered).
- [ ] Opening DevTools on the side panel → Console: no errors on load, no errors after adding/editing/deleting items.
- [ ] The extension works correctly after Chrome restart (storage persists across browser restarts, not just tab switches).

---

## Remaining Work — Build Order

> These features fill the gaps left across Phases 9–15. Complete each one fully (all checkboxes green) before starting the next.

---

### Feature 1 — Snippet Item _(completes Phase 9)_

**`src/sidepanel/components/items/SnippetItem.tsx`** _(new)_

- Same layout and editing as `TextItem` (reuse `RichTextEditor`, `useDrag`, resize handle, bubble menu)
- Hover-only attribution bar below content: "from: {hostname}" in Outfit 11px `--text-muted`; `opacity: 0` at rest → `opacity: 1` on hover, `transition: opacity 120ms ease`
- `max-height: 200px; overflow: hidden` on the content area for long snippets

**`src/sidepanel/components/CanvasItem.tsx`** _(edit)_

- Change `type === 'snippet'` to render `<SnippetItem>` instead of `<TextItem>`

- [x] Send a text selection from a webpage → snippet card appears with correct text
- [x] Hover the snippet → "from: hostname.com" attribution appears below content
- [x] Mouse away → attribution disappears
- [x] Snippet with 600+ characters → content capped at 200px height, no overflow
- [x] Drag, delete, and edit work identically to a text item

---

### Feature 2 — Copy URL on Link Items _(completes Phase 10 partially)_

**`src/sidepanel/components/items/LinkItem.tsx`** _(edit)_

- Add a Copy button to the selection bubble (between Open ↗ and the divider/trash)
- `navigator.clipboard.writeText(item.url ?? '')` on click
- Same green-flash feedback pattern as TextItem copy (800ms)

- [x] Select a link item → bubble shows `[ Open ↗ ][ Copy ][ 🗑 ]`
- [x] Click Copy → URL is in clipboard (verify by pasting elsewhere)
- [x] Copy icon briefly turns green on success

---

### Feature 3 — Duplicate _(completes Phase 10 partially + Cmd+D shortcut)_

**`src/sidepanel/components/items/TextItem.tsx`** _(edit)_

- Add Duplicate button to the bubble (between Copy and trash)
- Calls `onDuplicate` prop on click

**`src/sidepanel/components/items/LinkItem.tsx`** _(edit)_

- Same: add Duplicate button to its bubble

**`src/sidepanel/components/CanvasItem.tsx`** _(edit)_

- Implement `onDuplicate`: `addItem({ ...item, id: crypto.randomUUID(), position: { x: item.position.x + 20, y: item.position.y + 20 }, createdAt: Date.now(), updatedAt: Date.now() })`

**`src/sidepanel/components/Canvas.tsx`** _(edit)_

- Add `Cmd/Ctrl+D` shortcut: duplicates the currently selected item

**`src/sidepanel/components/ShortcutsModal.tsx`** _(edit)_

- Add `Ctrl+D` / "Duplicate selected" row

- [x] Select a text item → bubble shows Duplicate button → click → copy appears offset by 20px
- [x] Select a link item → same
- [x] `Cmd/Ctrl+D` with item selected → duplicate created
- [x] `Cmd/Ctrl+D` with nothing selected → no-op
- [x] Shortcuts modal lists `Ctrl+D`

---

### Feature 4 — Undo _(Phase 11 + clipboard-denied toast from Phase 14)_

**`src/sidepanel/lib/undo.ts`** _(new)_

- Module-level LIFO stack (max 20 entries), same subscriber pattern as `flash.ts`
- `pushUndo(entry: { description: string; restore: () => void })`
- `popUndo(): UndoEntry | undefined`
- `subscribeUndo(cb): () => void`

**`src/sidepanel/store/boardStore.ts`** _(edit)_

- `deleteItem`: snapshot item before removing, push undo entry
- `clearBoard`: snapshot all items, push undo entry

**`src/sidepanel/components/Toast.tsx`** _(new)_

- Fixed bottom-right, above zoom badge (`z-index: 20`)
- Props: `message`, optional `action: { label, onClick }`, `duration` (default 3000ms)
- Slide-in from right: `translateX(110%) → translateX(0)`, 150ms ease-out
- Auto-dismisses after `duration`; immediate dismiss on action click

**`src/sidepanel/components/Canvas.tsx`** _(edit)_

- `Cmd/Ctrl+Z` calls `popUndo()?.restore()`
- Subscribe to `subscribeUndo` → show `<Toast>` with "Item deleted — Undo" and Undo action button

**`src/sidepanel/components/ContextMenu.tsx`** _(edit)_

- On clipboard permission denied in Paste handler: show `<Toast>` "Clipboard access denied"

**`src/sidepanel/components/ShortcutsModal.tsx`** _(edit)_

- Add `Ctrl+Z` / "Undo" row

- [x] Delete a text item → "Item deleted — Undo" toast appears bottom-right
- [x] Click Undo in toast → item restored at original position
- [x] `Cmd/Ctrl+Z` → same undo behaviour
- [x] Toast auto-dismisses after 3 seconds
- [x] Delete 3 items → `Cmd/Ctrl+Z` × 3 restores them in reverse order
- [x] Clear board → toast appears → Undo restores all items
- [x] After 20 deletions without undo, the 21st `Cmd/Ctrl+Z` does nothing
- [x] Clipboard permission denied during Paste → "Clipboard access denied" toast appears
- [x] Shortcuts modal lists `Ctrl+Z`

---

### Feature 5 — Multi-select _(completes Phase 10)_

**`src/sidepanel/components/Canvas.tsx`** _(edit)_

- Replace `selectedId: string | null` with `selectedIds: Set<string>`
- `Shift+click` an item: toggle its membership in `selectedIds`
- Click canvas background: clear all `selectedIds`
- `Delete`/`Backspace`: delete all selected items (single undo entry restoring all)
- `Cmd/Ctrl+D`: duplicate all selected items
- Drag on any selected item: apply the same `dx/dy` delta to all selected items

**`src/sidepanel/components/CanvasItem.tsx`** _(edit)_

- `isSelected` derives from `selectedIds.has(item.id)`
- Pass `onShiftSelect` prop for shift-click behaviour

- [x] Shift+click a second item → two amber rings visible
- [x] Shift+click an already-selected item → it deselects
- [x] Delete with two items selected → both removed; single `Cmd/Ctrl+Z` restores both
- [x] Drag one of two selected items → both move together with the same delta
- [x] `Cmd/Ctrl+D` with two selected → two duplicates created

---

### Feature 6 — Empty State _(Phase 12)_

**`src/sidepanel/components/EmptyState.tsx`** _(new)_

- Positioned at canvas coords `(0, 0)` inside the transform layer (pans with canvas)
- Heading: "Your board is empty." — Outfit 18px 600 `--text-secondary`
- Sub-line: "Click anywhere to start, or add your current tab." — Outfit 14px `--text-muted`
- Three non-interactive pill chips: `[ Click anywhere ]` `[ Paste a link ]` `[ Alt+Q ]` — ghost style, amber border
- Fade-in on mount (`opacity 0 → 1`, 300ms), fade-out when first item added (`opacity 1 → 0`, 200ms)

**`src/sidepanel/components/Canvas.tsx`** _(edit)_

- Render `<EmptyState>` inside the transform layer when `items.length === 0`
- `hasEverHadItems` local ref: once true, empty state only reappears after `clearBoard()`

- [x] Fresh board → empty state visible with heading, sub-line, and three hint chips
- [x] Empty state fades in (not instant)
- [x] Add an item → empty state fades out and disappears
- [x] Delete the last item → empty state does NOT reappear
- [x] Clear board → empty state reappears
- [x] Returning user with saved items → empty state never shows

---

### Feature 7 — Keyboard + Polish _(completes Phases 13 & 15)_

**`src/sidepanel/components/Canvas.tsx`** _(edit)_

- Add `Cmd/Ctrl+0` shortcut: reset zoom to 1.0, keep current pan

**`src/sidepanel/components/Toolbar.tsx`** _(edit)_

- Add hover background (`var(--item-hover-bg)`) to the ⌨ and ⋯ icon buttons

**`src/sidepanel/components/ShortcutsModal.tsx`** _(edit)_

- Add `Ctrl+0` / "Reset zoom" row
- Ensure `Alt+C` / "Recenter view" row is present and correct

- [x] `Cmd/Ctrl+0` resets zoom to 100% without changing pan
- [x] Hovering the ⌨ toolbar button shows a subtle background tint
- [x] Hovering the ⋯ toolbar button shows a subtle background tint
- [x] Shortcuts modal accurately lists all implemented shortcuts including `Ctrl+D`, `Ctrl+Z`, `Ctrl+0`, `Alt+C`

---

_End of Implementation Guide — v1.0_
