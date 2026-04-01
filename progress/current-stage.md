# Current Stage

## Implemented In This Pass
- Replaced the placeholder mini-puzzle with a real rune-ordering artifact puzzle in the egg chamber.
- Added data-driven rune puzzle content and reusable puzzle-evaluation logic modules.
- Extended run state to track mini-puzzle attempts in addition to hints, penalties, and the unlocked keyword.
- Updated the maze so it now requires an earned key in `RunState` before the checkpoint markers will respond.
- Kept the current maze clue translation temporary, but made it clearly depend on the real unlocked key instead of bypassing the mini-puzzle.

## Key Files To Inspect
- `package.json`
- `vite.config.ts`
- `src/core/game.ts`
- `src/systems/RunState.ts`
- `src/scenes/MiniPuzzleScene.ts`
- `src/scenes/MazeScene.ts`
- `src/scenes/ResultsScene.ts`
- `src/puzzles/runeSequencePuzzle.ts`
- `src/puzzles/runeSequenceLogic.ts`
- `src/data/mazeCheckpoints.ts`

## How To Run Locally
1. Install Node.js if it is not already available on your machine.
2. From the repo root, run `npm install`.
3. Start local development with `npm run dev`.
4. Open the Vite URL shown in the terminal, usually `http://127.0.0.1:5173`.

## Verification Note
- Source files and project structure are in place.
- `npm install --ignore-scripts --cache .npm-cache` completed successfully in this environment.
- `tsc --noEmit` passes.
- Full Vite build could not be executed inside this sandbox because `esbuild` child-process spawning fails here with `spawn EPERM`.

## Assumptions
- Kept the keyword fixed at `TRIWIZARD` for this milestone.
- Used a five-rune ordering puzzle because it fits the docs' preferred fragment/rune direction while staying readable in a first playable slice.
- Kept the timer starting on `Begin Trial` from the intro scene, matching the preferred documentation direction.

## How The Puzzle Works
- The player must place five rune fragments onto five pedestals so all omen cards are true.
- The omen cards describe positional relationships such as immediate-left chains and one rune standing between two others.
- The player clicks a fragment to select it, places it on a pedestal, and then presses `Test Sequence` to judge the arrangement.
- Incorrect tests record an attempt and color the omen cards by which relationships are satisfied.
- `Take Hint` locks the next unresolved correct pedestal and costs time.
- Solving the sequence reveals the key word `TRIWIZARD` and unlocks the maze transition.

## What Remains Temporary
- Maze checkpoints still expose a provisional translated command once the real key has been earned.
- The full keyed cipher interaction for decoding checkpoint text is not implemented yet.
- The mini-puzzle uses procedural UI art rather than bespoke asset work.

## Recommended Next Step
Build Milestone 5:
- replace the provisional maze translation with real key-based cipher decoding,
- let the unlocked keyword actively drive clue solving at each checkpoint,
- preserve the current branching checkpoint flow and penalty system,
- then refine feedback and presentation once the cipher loop is real.
