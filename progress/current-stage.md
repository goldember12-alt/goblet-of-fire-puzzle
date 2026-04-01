# Current Stage

## Review Source Used For This Pass
- Treated [`edits(2).txt`](../edits(2).txt) as the primary review punch list for this pass.
- Re-read `AGENTS.md`, every file in `/docs`, `progress/current-stage.md`, the current scene files, shared UI/layout helpers, cipher logic, and rune/artifact data before editing.

## Issues Addressed From The Newest Edits File
- Intro wording and alignment:
  - removed the clunky `First marker onboarding` phrasing,
  - changed `solve the artifact` language to `solve the egg`,
  - tightened the Trial Flow stack so the numbered bubbles and text align more cleanly,
  - and compressed the Trial Flow layout so the third step no longer relies on overflow-prone spacing.
- Cipher primer correction:
  - replaced the contradictory primer example with a mathematically consistent one that matches the actual Vigenere-style implementation,
  - switched the displayed helper from signed subtraction text to a clearer `Back` row,
  - and added an explicit `A = 0` note so the shift math is understandable.
- Persistent HUD overlap:
  - increased global header/footer reserves in `src/ui/layout.ts`,
  - rebuilt `RunHud` into a tighter stacked layout,
  - shortened ledger copy so the phase, timer, key, and meta lines stay inside the HUD panel across scenes.
- Artifact Chamber layout:
  - made the egg larger and more central,
  - pushed Omen Cards farther right and gave the chamber more width,
  - arranged rune panels around the egg in a more intentional surround layout,
  - moved selected-fragment and instruction text away from the crowded lower chamber,
  - and kept the button hit area aligned with the full visible rune card.
- Rune presentation:
  - added simple icon identifiers to rune data,
  - showed each rune as an icon + name + sigil card instead of text-only strips,
  - and preserved full-panel click targets for every rune fragment.
- Maze readability:
  - condensed the Maze Vista panel footprint and gave the cipher workspace more width,
  - rebuilt the decoder area so labels, columns, helper text, and route controls remain separated,
  - and resized/repositioned results content so the replay goal no longer crowds the summary content.
- Guessing reduction:
  - route plaques no longer expose direct direction labels,
  - route plaques stay disabled until the player fills the decode row and presses `Confirm Decode`,
  - incorrect decode submissions now cost time,
  - and the player must meaningfully use the cipher before route selection becomes available.
- Maze feel:
  - replaced the old straight progress-strip feel with a branching chamber preview,
  - made route choices appear as separate hedge branches with disguised plaques,
  - and adjusted checkpoint flavor text to frame each stop as a junction rather than a straight hallway.

## Files Changed Most
- `src/ui/layout.ts`
- `src/ui/runHud.ts`
- `src/scenes/IntroScene.ts`
- `src/scenes/MiniPuzzleScene.ts`
- `src/scenes/MazeScene.ts`
- `src/scenes/ResultsScene.ts`
- `src/data/mazeCheckpoints.ts`
- `src/puzzles/runeSequencePuzzle.ts`

## What Was Done To Eliminate Overlap
- Expanded the shared header and footer safe areas so title stacks, HUD panels, play panels, and footer feedback no longer compete for the same vertical space.
- Compressed Run Ledger copy into shorter two-line summaries and repositioned the internal text stack to keep it inside the panel.
- Reflowed intro, mini-puzzle, maze, and results compositions so decorative elements give way to readable text and interaction space.
- Shifted the egg-chamber selection text out of the crowded lower ring area and kept the Omen Cards/status region in its own smaller right-side panel.
- Increased the breathing room between maze decoder text, confirmation flow, route plaques, and footer feedback.

## What Was Done To Clarify The Cipher Tutorial
- Aligned the intro primer with the real implementation in `src/puzzles/mazeCipher.ts`.
- Replaced the broken `R C M M` example with `E V N P`, which correctly decodes to `L E F T` using the first four letters of `TRIWIZARD`.
- Clarified that the helper values are backward shifts derived from key letters with `A = 0`.
- Updated maze tutorial copy so the intended flow is now:
  - fill the decoder row,
  - confirm the decode,
  - then choose the matching branch.

## What Was Done To Reduce Guessing And Improve Maze Feel
- Added per-checkpoint `Confirm Decode` gating so route selection is not available before the cipher is actually engaged with.
- Added a decode-failure time penalty to make brute-force guessing materially worse.
- Reworked route presentation from obvious directional buttons to disguised route plaques with randomized sigils.
- Restructured `src/data/mazeCheckpoints.ts` to build checkpoints through `buildMazeRunCheckpoints()`, which now supports per-run randomized disguised route markers.
- Updated the maze preview to show a branching chamber with multiple plausible exits instead of a simple straight-line progress path.

## Remaining Unresolved Or Risky Items
- This shell session does not currently have `node`/`npm` available on PATH, so I could not run `tsc --noEmit` or a local Vite build after the edits. This pass was manually reviewed in-source, but browser verification is still required.
- The new randomized sigil system is a preparation step and a first implementation, not a final content-rich disguise layer yet.
- Checkpoint variety beyond cipher solving is still only architectural preparation; no new Goblet-themed checkpoint minigames were added in this pass.
- Final visual polish, animation balancing, and direct browser playtest tuning are still needed, especially for smaller desktop windows.

## Recommended Next Milestone
- Run a fresh hands-on browser playtest focused on:
  - confirming there is no remaining panel/text overlap at common desktop sizes,
  - validating that the new decode-confirm-route flow meaningfully reduces guessing without feeling tedious,
  - tuning the egg-chamber and maze typography after real use,
  - then planning the next checkpoint milestone around richer disguised hints and optional non-cipher checkpoint variety.
