# Alt+Q Onboarding Plan

## Overview

A 6-step tooltip-style onboarding that teaches the core features of Alt+Q through guided interaction. Each step anchors a small coach-mark tooltip next to the relevant UI element, with a spotlight ring drawing the eye. Funny copy appears contextually near where the action happened, then fades out before auto-advancing.

**Design principles:**
- Tooltip-style popups anchored to target elements (not bottom-bar cards)
- GSAP-only animations (no Anime.js) — fade, slide, scale
- CSS `@keyframes` for simple infinite loops (spotlight pulse)
- Funny copy appears *after* the user completes the action, near the action site, then fades
- No blocking overlays except Welcome and Done
- Side panel defaults to 50% browser width

---

## Step Flow

### Step 1 — Welcome

| | |
|---|---|
| **Type** | Centered card (small modal, not full-screen) |
| **Target** | None (center of panel) |
| **User action** | Click "Let's go" |
| **What happens** | Card fades in (GSAP). Static mascot blob SVG at top. Brief intro text. Progress dots (6 total). "Let's go" CTA + "Skip tutorial" link. |
| **Transition** | On click → GSAP fade-out → advance to Step 2 |

**Copy:**
- Title: "Welcome to your browser attic"
- Body: "Stash tabs, paste ideas, drag things around. Let's put one useful thing in here."

---

### Step 2 — Save This Tab

| | |
|---|---|
| **Type** | Tooltip anchored to the "+ Add tab" button |
| **Target** | `[data-onboarding-target="add-tab"]` |
| **User action** | Click the "+ Add tab" button |
| **What happens** | Tooltip appears next to the button (below or left, depending on space). Spotlight ring pulses on the button (CSS animation). Listens for `ADD_TAB_CLICKED` event. |
| **On completion** | Funny copy toast appears near the newly created item: *"Your wild tab has been captured."* → fades out after 1.5s → advance to Step 3 |

**Tooltip copy:**
- "Hit **+ Add tab** to save this page to your board."

**Spotlight:** CSS `@keyframes` pulse on the ring (no GSAP needed for infinite loops).

---

### Step 3 — Add Content via Context Menu

| | |
|---|---|
| **Type** | Tooltip anchored to center-ish of canvas area |
| **Target** | Canvas background |
| **User action** | Click canvas background → context menu opens → pick Text, Link, or Paste |
| **What happens** | Tooltip appears in the center of the visible canvas area. Instructs user to click the empty space. Listens for `ITEM_CREATED` event (NOT `CONTEXT_MENU_OPENED` — this avoids the race condition where the old step exits before the new one mounts). The context menu is the native product UI; we don't interfere with it. |
| **On completion** | Funny copy appears near the newly created item: *"Look at you, populating the void."* → fades out after 1.5s → advance to Step 4 |

**Tooltip copy:**
- "Click anywhere on the canvas to add text, links, or paste something."

**Key fix:** Previous implementation split this into two steps (click canvas → pick from menu) causing a race condition. Now it's one step that waits for the final outcome (`ITEM_CREATED`).

---

### Step 4 — Drag to Organize

| | |
|---|---|
| **Type** | Tooltip anchored near the most recently created item |
| **Target** | The last item added (from Step 2 or 3) |
| **User action** | Drag any item >= 40px |
| **What happens** | Tooltip appears next to the target item. Listens for `ITEM_MOVED` event. |
| **On completion** | Funny copy near the dragged item: *"Spatial thinker. We see you."* → fades out after 1.5s → advance to Step 5 |

**Tooltip copy:**
- "Grab any card and drag it somewhere. Your board, your rules."

---

### Step 5 — Pro Tip: Text Selection

| | |
|---|---|
| **Type** | Tooltip anchored center of canvas (instructional, not interactive) |
| **Target** | None (informational step) |
| **User action** | Click "Got it" button |
| **What happens** | Tooltip with a small illustration (text selection icon — a simple SVG of a cursor selecting text). Explains that users can select text on any webpage and add it to Alt+Q. This is a non-interactive "did you know" step since the action requires the main page. |
| **Transition** | On "Got it" click → fade out → advance to Step 6 |

**Tooltip copy:**
- Title: "Pro tip"
- Body: "Select any text on a webpage, right-click, and choose **Add to Alt+Q** — or just hit **Alt+Q** with text selected."

---

### Step 6 — Done

| | |
|---|---|
| **Type** | Centered card (same style as Welcome) |
| **Target** | None (center of panel) |
| **User action** | Click "Done" |
| **What happens** | Card fades in. Static mascot blob. All progress dots filled. "Done" CTA dismisses onboarding permanently. |
| **Transition** | On click → GSAP fade-out → `dismissed: true` persisted to chrome.storage.local |

**Copy:**
- Title: "You're all set"
- Body: "Your attic is open for business. Stash anything, organize everything."

---

## Architecture

### Animation Strategy

**GSAP (kept):**
- `enterTooltip(el)` — fade + scale from 0.95 → 1, 250ms
- `exitTooltip(el, onComplete)` — fade out + slight scale down, 180ms
- `enterCard(el)` — same as enterTooltip but for Welcome/Done cards
- `exitCard(el, onComplete)` — same as exitTooltip
- `showFunnyCopy(el)` — fade in + slight y-offset, 300ms
- `hideFunnyCopy(el, onComplete)` — fade out, 250ms

**CSS (new):**
- `@keyframes spotlight-pulse` — box-shadow + scale oscillation on the ring, infinite
- `@keyframes fade-in` — simple opacity 0 → 1 for initial renders

**Removed:**
- Anime.js entirely (line-draw, morph, motion-path, spin-loop, spark-lines)
- All SVG stroke-drawing animations
- Confetti dots
- Morph animations

### Component Structure

```
onboarding/
  OnboardingOverlay.tsx          — Root orchestrator (renders active step)
  Tooltip.tsx                    — Shared tooltip component (anchored to target via rect)
  SpotlightRing.tsx              — Pulsing ring (CSS animation, repositions on resize)
  FunnyCopy.tsx                  — Contextual toast that appears near action, fades out
  animations/gsap.ts             — GSAP helpers (simplified)
  assets/MascotBlob.tsx          — Static blob SVG (no line-draw)
  steps/
    Step1Welcome.tsx
    Step2SaveTab.tsx
    Step3AddContent.tsx
    Step4DragItem.tsx
    Step5ProTip.tsx
    Step6Done.tsx
```

**Deleted:**
- `StepCard.tsx` (replaced by Tooltip.tsx)
- `YoinkAnnotation.tsx`
- `animations/anime.ts`
- `assets/CrayonArrow.tsx`
- `assets/Compass.tsx`
- `assets/BrowserTab.tsx`
- `assets/GhostCursor.tsx`

### Tooltip Positioning

The `Tooltip` component:
1. Takes a `target` CSS selector (or "center" for non-anchored tooltips)
2. Uses `getBoundingClientRect()` on the target element
3. Calculates preferred position (below, above, left, right) based on available space
4. Repositions on `ResizeObserver` callback (fixes the stale-position bug)
5. Has a small arrow/caret pointing toward the target

For "center" tooltips (Steps 1, 5, 6): absolutely positioned in the middle of the panel.

### SpotlightRing Fix

- Uses `ResizeObserver` + `requestAnimationFrame` to track target position
- Recalculates on every frame while visible (lightweight since it's just reading one rect)
- CSS animation for the pulse (no GSAP needed for infinite loops)

### Event Flow & Race Condition Fix

**Old Step 3→4 race condition:**
```
CONTEXT_MENU_OPENED fires → Step 3 exits (200ms animation) → Step 4 mounts → ITEM_CREATED may have already fired
```

**New Step 3 (merged):**
```
Step 3 mounts → listens for ITEM_CREATED → user clicks canvas → menu opens → user picks → ITEM_CREATED fires → Step 3 catches it → funny copy → advance
```

No race condition because one step handles the entire flow.

### Store Changes

```typescript
// 6 steps instead of 7
const TOTAL_STEPS = 6;

// advanceStep: dismiss at step >= 6
advanceStep: () => {
  const { step } = get();
  if (step >= 6) {
    set({ dismissed: true });
  } else {
    set({ step: step + 1 });
  }
}
```

`completedSteps` array can be removed — we only need `step` and `dismissed`. Simpler.

### Events Cleanup

Remove unused events:
- `CONTEXT_MENU_OPENED` — no longer needed (Step 3 listens for ITEM_CREATED instead)
- `ITEM_EDITING_STOPPED` — no longer needed (no two-phase Step 4)
- `VIEWPORT_CHANGED` — no longer needed (no pan/zoom step)
- `RECENTER_CLICKED` — no longer needed (no recenter step)

**Remaining events:**
- `ADD_TAB_CLICKED` — Step 2
- `ITEM_CREATED` — Step 3
- `ITEM_MOVED` — Step 4

### Integration Changes

- **RecenterButton.tsx**: Remove onboarding imports and `bottomOffset` logic (no more StepCard)
- **EmptyState.tsx**: Keep hiding during onboarding (no change)
- **Canvas.tsx**: Remove `CONTEXT_MENU_OPENED` emit (no longer needed). Keep `ITEM_EDITING_STOPPED` emit for product use but remove onboarding dependency.
- **useCanvasPan.ts**: Remove `VIEWPORT_CHANGED` emit
- **useCanvasZoom.ts**: Remove `VIEWPORT_CHANGED` emit

### FunnyCopy Component

A floating label that:
1. Appears near a target position (e.g., the newly created item's screen coordinates)
2. GSAP fades in with a slight bounce (300ms)
3. Stays for 1.5 seconds
4. GSAP fades out (250ms)
5. Calls `onComplete` after fade-out

```typescript
interface FunnyCopyProps {
  text: string;
  position: { x: number; y: number };
  onComplete: () => void;
  delay?: number; // ms before showing (default 200)
  duration?: number; // ms visible (default 1500)
}
```

---

## Implementation Phases

### Phase 1: Cleanup
1. Remove Anime.js dependency from package.json
2. Delete `animations/anime.ts`
3. Delete unused assets: `BrowserTab.tsx`, `GhostCursor.tsx`, `CrayonArrow.tsx`, `Compass.tsx`
4. Delete `YoinkAnnotation.tsx`, `StepCard.tsx`
5. Delete old step files (Step1-7)

### Phase 2: New Shared Components
1. Create `Tooltip.tsx` with dynamic anchoring + ResizeObserver
2. Create `FunnyCopy.tsx`
3. Update `SpotlightRing.tsx` with ResizeObserver + CSS pulse
4. Simplify `animations/gsap.ts` (remove unused helpers, add tooltip enter/exit)
5. Simplify `MascotBlob.tsx` (remove star morph path, line-draw refs)

### Phase 3: Step Components
1. `Step1Welcome.tsx` — Centered card with static mascot
2. `Step2SaveTab.tsx` — Tooltip + spotlight on Add Tab button
3. `Step3AddContent.tsx` — Canvas-center tooltip, waits for ITEM_CREATED
4. `Step4DragItem.tsx` — Tooltip near item, waits for ITEM_MOVED
5. `Step5ProTip.tsx` — Centered instructional tooltip with "Got it"
6. `Step6Done.tsx` — Centered completion card

### Phase 4: Integration Updates
1. Update `OnboardingOverlay.tsx` for 6 steps
2. Simplify `onboardingStore.ts` (remove completedSteps, update to 6 steps)
3. Clean up `events.ts` (remove unused event types)
4. Update `RecenterButton.tsx` (remove onboarding offset logic)
5. Update `Canvas.tsx` (remove CONTEXT_MENU_OPENED emit)
6. Update `useCanvasPan.ts` and `useCanvasZoom.ts` (remove VIEWPORT_CHANGED)

### Phase 5: Verify
1. TypeScript build passes
2. Manual walkthrough of all 6 steps
3. Verify skip tutorial works
4. Verify persistence across panel reopen
