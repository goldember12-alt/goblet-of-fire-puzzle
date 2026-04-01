# Current Stage

## Implemented In This Pass
- Applied a readability and interaction polish pass across the title, intro, mini-puzzle, and maze scenes.
- Treated the user-provided scene-by-scene review notes as the main task list because `edits.txt` exists but is currently empty in the workspace.
- Removed extra top-of-screen copy where requested, tightened panel spacing, and reduced overlap pressure in the opening and intro scenes.
- Reworked the Golden Egg scene to create more breathing room:
  - raised the title/objective block,
  - tightened the Run Ledger header stack through shared HUD updates,
  - simplified rune cards to title-only buttons,
  - repositioned the rune ring around the egg,
  - made pedestal slots more compact and readable,
  - and lowered the explanatory solve/status copy for better legibility.
- Rebalanced the maze layout so the decoder workspace has more room and the Maze Vista panel takes less space.
- Added clearer keyboard guidance and support for `Up` / `Down` letter cycling in the maze decoder.
- Removed the easiest answer-length shortcut by changing maze route buttons to standardized path-sign labels with symbol markers instead of visibly exposing full command words.
- Fixed button interaction so the visible button body now matches the actual clickable area across scenes.

## Key Files To Inspect
- `src/ui/button.ts`
- `src/ui/runHud.ts`
- `src/scenes/TitleScene.ts`
- `src/scenes/IntroScene.ts`
- `src/scenes/MiniPuzzleScene.ts`
- `src/scenes/MazeScene.ts`
- `src/data/mazeCheckpoints.ts`
- `src/puzzles/mazeCipher.ts`

## How To Run Locally
1. From the repo root, run `npm install` if dependencies are not installed yet.
2. Start local development with `npm run dev`.
3. Open the Vite URL shown in the terminal, usually `http://127.0.0.1:5173`.

## Verification Note
- `tsc --noEmit` passes in this environment.
- Full Vite execution is still blocked in this sandbox by the existing `esbuild` child-process `spawn EPERM` restriction, so browser verification still needs to happen locally.

## What Was Addressed From The Review Notes
- Opening / title screen:
  - removed the extra subtitle line under the title,
  - removed the extra overview overline,
  - replaced the main centered overview sentence,
  - kept the timer note inside the Trial Overview panel,
  - and relied on the new shared button hit-zone fix.
- Intro screen:
  - removed the extra description line below the title,
  - tightened Trial Flow and Maze Primer content,
  - reduced crowding inside both panels,
  - and updated the primer to explain keyboard controls more clearly.
- Golden Egg screen:
  - shifted the title/objective stack upward,
  - improved Run Ledger spacing through `RunHud`,
  - centered and simplified the egg chamber layout,
  - reduced rune-card text to just the rune titles,
  - simplified pedestal content to initials,
  - improved Omen Card spacing,
  - and made solved-state copy easier to read.
- Maze:
  - reduced the Maze Vista footprint,
  - expanded the cipher workspace,
  - improved tutorial readability at Thorn Gate,
  - added `Up` / `Down` decoder cycling,
  - and changed route-choice presentation so answer length is no longer the obvious shortcut.

## Button Hit Area Fix
- Buttons now use an internal invisible hit-zone rectangle inside the visible button body instead of relying on the container’s old input region alone.
- Hover, press, enable/disable, and resized button states all use that same hit zone.
- This makes the visible button surface match the clickable area more reliably in the title, intro, mini-puzzle, maze, and results scenes.

## Anti-Guessing Change
- Maze choices no longer display the full decoded command word on the button.
- Instead, route buttons now use a standardized `Path A/B/C` style plus a compact direction marker such as `<`, `>`, `^`, or `v`.
- The player still has enough information to act fairly after decoding, but cannot bypass the cipher simply by counting the visible answer lengths on the buttons.

## What Still Feels Rough
- `edits.txt` itself is empty, so this pass used the explicit review bullets from the task prompt rather than file-specific line edits.
- The game is much cleaner to read now, but some final typography tuning and decorative art polish still remain.
- The maze decoder helper is clearer and fairer, but it is still a lightweight prototype UI rather than a final-production interface.
- The results screen did not need major structural changes this pass, so most polish energy stayed on active-play scenes.

## Recommended Next Step
Run another hands-on playtest pass focused on:
- validating the new path-sign system against real player intuition,
- checking whether any scene still crowds at smaller desktop sizes,
- tuning any remaining text sizes or panel spacing after direct use,
- then moving into atmosphere and presentation polish once the input/readability issues feel settled.
