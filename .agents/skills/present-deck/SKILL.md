---
name: present-deck
description: A browser-native, responsive 16:9 executive presentation slide deck engine with animated vector visuals, gold metallic typography, keyboard/touch navigation, auto-cloned thumbnail picker, and staggered CSS keyframe builds.
---

# Browser-Native Executive Presentation Deck (Present Engine)

This skill provides the complete architecture and styling patterns for creating presentation decks running natively in any browser with zero external framework dependencies.

## 1. Core Architecture Principles

1. **Fixed 16:9 Stage with Relative Em Scaling (`min(1vw, 1.7778dvh)`):**
   - Stage size: `width: min(100vw, 177.78dvh); aspect-ratio: 16 / 9; font-size: min(1vw, 1.7778dvh);`
   - Every element inside `.ag` uses `em` units, where `1em = 1% of the 16:9 stage width`.
   - Guaranteed identical layout across mobile, tablets, desktop monitors, and 4K conference projectors.

2. **Luxury Apple / Royal Gold Aesthetic:**
   - Background Canvas: `radial-gradient(ellipse at 50% 58%, #1a3a68 0, #0d2242 42%, #081830 75%, #071426 100%)`
   - Accent Gold Typography: `background: linear-gradient(100deg, #b98a2f 0, #f3d27a 40%, #fff4c9 50%, #f3d27a 60%, #b98a2f 100%)` with shine keyframe animations.
   - Frosted Glass Overlays: `backdrop-filter: blur(14px) saturate(1.4);`

3. **Staggered Keyframe Animation Engine:**
   - Uses CSS variable `--d` (delay): e.g. `<div class="step up" style="--d: 1.2s">`
   - Keyframe classes: `.fade`, `.up`, `.left`, `.right`, `.pop`, `.ignite`, `.hot`.

4. **Interactive Controls & Navigation:**
   - Controls: Previous (`←`), Page Selector (`1 / N ▾`), Next (`→`), Fullscreen (`⛶`).
   - Auto-idle cursor hiding after 3 seconds.
   - Modal Dialog Page Picker (`<dialog id="picker">`) that auto-clones live slides into responsive thumbnail cards using CSS container queries (`container-type: inline-size; font-size: 1cqw;`).
   - Keyboard bindings: `ArrowRight`, `ArrowLeft`, `Space`, `Enter`, `F` (Fullscreen), `G` (Grid Picker), `Home`, `End`.
   - Touch gestures: Horizontal swipe support with velocity threshold.
   - URL hash routing: Synchronizes with `#1`, `#2`, `#3`...

## 2. Standard Slide Archetypes

1. **Cover / Hero Slide (`.cover`, `.ag-center`):** Kicker pill, big gradient title, subtitle, and CTA pill.
2. **3-Column Stepper Cards (`.steps`, `.step`):** 3 sequential cards with step badges (`<h3><i>1</i>...</h3>`) and animated connecting lines (`.steps-l1`, `.steps-l2`).
3. **4-Tile Metric / Key Badges (`.keys`, `.key`):** 4 square or tall tiles with `<kbd>` keycap icons, highlighted titles, and `.hot` glowing effects.
4. **Interactive Flow Diagram (`.flow`, `.node`, `.loop`):** Animated data nodes with traveling light pulses (`pkRun`, `pkBack`).
5. **Technical / Architecture Table Rows (`.rows`, `.row`):** 2-column grid rows with gold bold category and detailed value text.
6. **Code / Prompt Copy Box (`.prompt`, `.prompt-bar`):** Dark terminal card with 1-click clipboard copy button.
