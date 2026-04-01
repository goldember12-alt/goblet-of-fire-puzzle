# Current Stage

## What Architecture Changed
- Refactored the project from a Phaser-drawn UI approach into a Phaser world plus shared HTML/CSS overlay architecture.
- Added a stable app shell in `index.html` with separate layers for:
  - the Phaser mount container,
  - and a dedicated DOM overlay root above it.
- Introduced a reusable overlay controller in `src/ui/overlay.ts` so scenes can mount a known layout instead of hand-building canvas HUDs and button groups.
- Added reusable DOM UI primitives in `src/ui/domUi.ts` for panels, stat strips, buttons, tutorial cards, and shared content blocks.
- Reworked `src/ui/layout.ts` so Phaser world layout now respects the sidebar-style overlay footprint on wider desktop windows instead of assuming the whole canvas is available for readable UI.

## What UI Moved From Phaser To DOM
- Title screen:
  - title hero card,
  - overview cards,
  - start button,
  - timer note.
- Intro screen:
  - trial flow briefing,
  - maze primer,
  - begin/back buttons,
  - timing note.
- Mini-puzzle screen:
  - HUD stats,
  - key display,
  - artifact instructions,
  - selected/alignment status copy,
  - omen-card modal,
  - action buttons,
  - status/footer feedback.
- Maze screen:
  - HUD stats,
  - checkpoint title and flavor copy,
  - ciphertext panel,
  - decoder helper rows,
  - editable decode inputs,
  - confirm decode control,
  - route choice buttons,
  - route feedback.
- Results screen:
  - final summary,
  - stat strip,
  - split breakdown cards,
  - replay button.

## Main Source Of Truth For Overlay UI
- `src/ui/overlay.ts`
- `src/ui/domUi.ts`
- `src/style.css`
- Scene-to-overlay wiring now lives primarily in:
  - `src/scenes/TitleScene.ts`
  - `src/scenes/IntroScene.ts`
  - `src/scenes/MiniPuzzleScene.ts`
  - `src/scenes/MazeScene.ts`
  - `src/scenes/ResultsScene.ts`

## How Resize And Layout Are Now Handled
- `index.html` now defines a stable shell with both the Phaser mount and overlay root inside the same bounded parent.
- Phaser still uses `RESIZE`, but the parent container is now deliberate instead of relying on vague body sizing.
- CSS owns the readable layout:
  - desktop uses a sidebar-oriented overlay layout,
  - narrower windows stack the overlay regions cleanly,
  - buttons use normal DOM hit areas and focus states,
  - panel spacing and wrapping come from CSS grid/flex instead of scene coordinate tuning.
- Phaser world scenes use `getWorldFrame(..., { reserveSidebar: true })` so decorative/world content avoids the main overlay column on larger windows.

## What Still Remains Canvas-Based
- Scene backdrop and atmosphere.
- Mini-puzzle artifact chamber:
  - egg,
  - rune fragments,
  - pedestals,
  - direct puzzle interaction.
- Maze vista:
  - hedge-branch preview,
  - branch markers,
  - chamber/world framing.
- Decorative scene framing on title, intro, and results.

## Verification Status
- `tsc --noEmit` passes when run through the direct Node executable.
- A full Vite production build could not complete in this environment because `esbuild` failed to spawn with `EPERM`.
- Browser playtesting is still required for:
  - final spacing checks,
  - keyboard focus feel,
  - decoder usability,
  - and overall visual integration between the Phaser world and DOM overlay.

## What Should Be Done Next
- Run an actual browser playtest across common desktop window sizes.
- Tune the DOM panel spacing and copy density after a real pass through title, intro, mini-puzzle, maze, and results.
- Add more visual/world motion so the DOM overlay feels even more integrated with the maze and artifact spaces.
- Expand checkpoint content and disguised route presentation now that the overlay architecture can handle larger readable puzzle panels cleanly.
