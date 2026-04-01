# Current Stage

## Implemented In This Pass
- Expanded the maze from a short 3-checkpoint teaching slice into a 6-checkpoint short run with a clearer arc from onboarding to final pressure.
- Kept the maze data-driven by moving checkpoint pacing and penalty tuning further into `src/data/mazeCheckpoints.ts` and `src/data/runConfig.ts`.
- Added named maze penalty tiers and a shared mini-puzzle hint penalty constant so timing pressure is easier to tune without digging through scene logic.
- Updated maze progression tracking so each cleared checkpoint records a split-like result entry for the finish screen.
- Refined the results screen to better support replay by showing a clearer run-quality summary plus checkpoint split information.
- Updated the maze preview logic so a longer checkpoint list still fits cleanly inside the current responsive layout.

## Key Files To Inspect
- `src/data/mazeCheckpoints.ts`
- `src/data/runConfig.ts`
- `src/scenes/MazeScene.ts`
- `src/systems/RunState.ts`
- `src/scenes/ResultsScene.ts`
- `src/puzzles/mazeCipher.ts`

## How To Run Locally
1. From the repo root, run `npm install` if dependencies are not installed yet.
2. Start local development with `npm run dev`.
3. Open the Vite URL shown in the terminal, usually `http://127.0.0.1:5173`.

## Verification Note
- `tsc --noEmit` passes in this environment.
- Full Vite execution is still blocked in this sandbox by the existing `esbuild` child-process `spawn EPERM` restriction, so browser verification still needs to happen locally.

## Checkpoint Expansion
- The maze now contains 6 checkpoints:
  - tutorial opener,
  - two opening stretch markers,
  - two pressure stretch markers,
  - one final marker.
- The decoded command sequence now forms a fuller short run:
  - `LEFT`
  - `FORWARD`
  - `NORTH`
  - `EAST`
  - `SOUTH`
  - `RIGHT`
- This keeps the interaction readable while extending the run enough to feel like a real short race rather than a pure tutorial.

## Difficulty Progression
- Checkpoint I:
  - short tutorial decode,
  - lowest penalties,
  - direct onboarding.
- Checkpoints II-III:
  - straightforward application,
  - one longer route word,
  - still focused on building decoder confidence.
- Checkpoints IV-V:
  - stronger pressure,
  - more punishing wrong branches,
  - route words still fair but recoveries cost more.
- Checkpoint VI:
  - short final clue for readability,
  - pressure comes from stakes and accumulated time rather than opaque cipher work.

## Balancing Changes
- Added shared maze penalty tiers in `src/data/runConfig.ts`:
  - `light = 4s`
  - `standard = 5.5s`
  - `heavy = 7s`
  - `severe = 8.5s`
- Kept the mini-puzzle hint penalty centralized as `15s`.
- The balance goal is now:
  - one mistake matters,
  - repeated mistakes are race-losing,
  - but a single wrong turn does not automatically ruin the run.
- The checkpoint preview and results screen now make the longer route easier to read and compare during playtesting.

## Replay And Results Improvements
- Results now show:
  - clearer performance summary text,
  - total penalties and mistake counts,
  - split-like checkpoint timings for each cleared marker.
- This gives repeat players more obvious feedback about where time was gained or lost even without a persistent leaderboard yet.

## What Still Feels Temporary
- The maze content is fuller now, but still intentionally modest rather than final-scale.
- Visual atmosphere and audio are still mostly placeholder-level.
- The split data is useful for replay, but there is still no saved best-time history or comparison across runs.
- Cipher interaction is readable and fair, but still uses the same lightweight helper presentation rather than a more polished final decoder UI.

## Recommended Next Step
Move into thematic polish and playtesting iteration:
- playtest the new 6-checkpoint route for actual completion times and penalty feel,
- tune clue order or branch punishments if any checkpoint spikes too hard,
- deepen atmosphere with subtle effects and audio,
- then consider lightweight best-time persistence or run-history comparison.
