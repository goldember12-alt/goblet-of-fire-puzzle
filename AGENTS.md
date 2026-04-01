# AGENTS.md

## Project Overview

This repository contains a browser-based puzzle-race game inspired by **Harry Potter and the Goblet of Fire**, specifically the **Third Task hedge maze** and a preceding **cipher-key unlock puzzle**.

The player experience is:

1. Start a timed run.
2. Solve a short mini-puzzle to unlock the cipher key.
3. Enter a hedge maze.
4. At each checkpoint, decode an encrypted clue using the unlocked key.
5. Choose the correct direction to advance.
6. Reach the Triwizard Cup as quickly as possible.
7. Submit or reveal a final answer to complete the run.

This game is intended to be:
- fast-paced
- readable
- atmospheric
- raceable between players
- implementable as a polished browser game

This repository should be built as a **Phaser-based web game**, preferably using **TypeScript** and a modern frontend build setup.

---

## Primary Objective

Build a polished single-player browser game with the following loop:

- **Phase 1:** Key-unlock mini-puzzle
- **Phase 2:** Timed hedge maze run
- **Phase 3:** End-of-run results

The game must prioritize:
- clear decision-making
- satisfying timing pressure
- understandable puzzle rules
- strong visual feedback
- maintainable architecture

---

## Core Design Requirements

### Required Gameplay Structure
The game must preserve all of the following:

1. **Players compete for best completion time**
   - The timer is central.
   - The game should support replayability and improvement.
   - Completion time should be visible and meaningful.

2. **Players make movement decisions in the maze**
   - Movement should be based on solving encrypted clues.
   - The player should not simply wander through a giant free-roam maze.
   - The maze should be composed of meaningful branching decision points.

3. **The cipher key is unlocked through a separate mini-puzzle**
   - The player should not start with the cipher key.
   - The key-unlock phase should feel distinct and rewarding.
   - The maze should become significantly more tractable once the key is discovered.

### Strong Recommended Direction
Implement the maze as a **branching route maze** rather than a fully free-roam labyrinth.

That means:
- a sequence of checkpoints
- each checkpoint presents 2–4 directional choices
- one or more wrong routes waste time
- progression is deliberate and readable

This is preferred because it better supports:
- raceability
- puzzle pacing
- balancing
- playtesting
- UI clarity

---

## Thematic Direction

The game should evoke:
- the **Triwizard Tournament**
- the **Third Task hedge maze**
- magical puzzle-solving
- enchanted objects and clues
- urgency and tension

The tone should be:
- mysterious
- elegant
- dark-academic/fantasy
- slightly ominous but not horror

Avoid making the experience feel:
- cartoonish
- childish
- generic fantasy
- cluttered
- overly text-heavy

---

## Technology Requirements

### Preferred Stack
- **Phaser**
- **TypeScript**
- modern frontend tooling
- browser-first deployment

### General Engineering Expectations
- keep code modular
- avoid unnecessary dependencies
- build with maintainability in mind
- prefer data-driven puzzle content when practical
- keep scenes and gameplay systems decoupled

### Expected Project Shape
The repository should likely evolve toward something like:

```text
/src
  /core
  /scenes
  /systems
  /ui
  /puzzles
  /data
  /assets
/docs
/progress
```

This structure may evolve, but architecture should remain clean and intentional.

---

## Source of Truth

When working in this repository, use the following priority order:

1. `AGENTS.md`
2. files in `/docs`
3. current codebase conventions
4. inline TODOs and task notes in `/progress`

If a conflict exists:
- prefer explicit project design docs over assumptions
- prefer existing architecture if it is clearly intentional
- do not introduce inconsistent systems without reason

If something is unspecified, make the most reasonable implementation choice and document it.

---

## Repository Operating Rules

### General Rules
- Do not make random structural changes without reason.
- Do not rewrite large parts of the codebase unless there is a clear need.
- Do not add dependencies casually.
- Do not leave placeholder logic in core gameplay without marking it clearly.
- Do not create duplicate systems when an existing one can be extended.

### Before Significant Changes
Before making a major gameplay or architecture change:
- inspect relevant files
- inspect docs in `/docs`
- understand current patterns
- preserve continuity unless the existing design is clearly broken

### After Significant Changes
After completing meaningful work:
- update relevant documentation if needed
- update progress notes if such files exist
- leave concise comments only where they add real value
- keep the repo in a runnable state whenever possible

---

## Build Philosophy

The project should be built as a **vertical slice first**, then expanded.

### Phase Order
Build in this order unless documentation says otherwise:

1. **Playable shell**
   - app boots
   - scene transitions work
   - basic visual style direction established

2. **Core timer and run state**
   - start run
   - track elapsed time
   - handle penalties
   - finish run

3. **Mini-puzzle prototype**
   - a playable key-unlock sequence
   - returns a discovered key

4. **Maze prototype**
   - a small set of checkpoints
   - clue display
   - path choice
   - correct/wrong route handling

5. **Cipher integration**
   - mini-puzzle output affects maze decoding
   - clue logic becomes real, not placeholder

6. **Visual polish**
   - atmosphere
   - transitions
   - effects
   - better typography
   - feedback

7. **Content expansion**
   - more checkpoints
   - richer puzzle design
   - better balancing
   - additional theming

### Important Principle
A smaller polished prototype is better than a large unfinished system.

---

## UX Priorities

The game should be easy to understand even when the puzzle itself is difficult.

### The player must always be able to tell:
- what stage they are in
- what they are trying to solve
- what inputs they can make
- what the timer is doing
- whether they made progress
- when they made a mistake

### The interface should emphasize:
- current clue
- current decision
- current timer
- unlocked key or decoding aid
- progress toward the goal

### Avoid
- tiny unreadable text
- overlong instructions
- confusing nested menus
- hidden essential information
- excessive animation that slows decision-making

---

## Puzzle Design Principles

### General Puzzle Rules
- puzzles should be hard because they are clever, not because they are opaque
- the player should be able to learn the rules and then apply them faster over time
- wrong answers should cost time, not create total confusion
- puzzle systems should support raceability

### Mini-Puzzle Rules
The mini-puzzle should:
- reveal the cipher key
- be self-contained
- not require external knowledge
- not rely on Harry Potter trivia
- ideally be solvable in under 90 seconds by a strong first-time player

### Maze Cipher Rules
The maze cipher should:
- use the unlocked key in a meaningful way
- create pressure at each checkpoint
- produce short actionable outputs such as:
  - LEFT
  - RIGHT
  - FORWARD
  - NORTH
  - SOUTH
  - TAKE EAST PATH
- avoid requiring repeated long-form text entry

### Final Validation
The run should ideally end with a final confirmation:
- reaching the Cup
- and/or entering/revealing a final extracted answer

This helps prevent brute-force path guessing.

---

## UI and Scene Expectations

The likely scene flow is:

1. **Boot / preload**
2. **Title screen**
3. **Intro / instructions**
4. **Mini-puzzle scene**
5. **Maze scene**
6. **Results scene**

This may be adjusted, but transitions should be coherent.

### Maze UI Expectations
The maze scene should likely contain:
- maze viewport
- player marker/avatar
- clue panel
- timer HUD
- checkpoint or progress display
- feedback area for wrong/correct choices

### Mini-Puzzle UI Expectations
The mini-puzzle should feel like a distinct magical artifact or challenge:
- e.g. Golden Egg, rune device, rotating rings, engraved cipher plate, etc.

---

## Visual Direction

Use a refined fantasy style:
- dark greens
- gold accents
- parchment neutrals
- stone/engraved UI motifs
- mist, glow, subtle magical effects

The game should look clean and readable first, atmospheric second.

### Important
Gameplay clarity is more important than decorative art.

---

## Audio Direction

If audio is added:
- keep it subtle
- use it to reinforce feedback
- avoid anything that becomes annoying over repeated runs

Good audio candidates:
- menu confirm sounds
- magical reveal sounds
- wrong-path penalty stings
- finish cue

Audio is optional in early stages.

---

## Data-Driven Content

Where practical, puzzle content should be represented as structured data rather than hardcoded scene logic.

Examples:
- checkpoint definitions
- clue strings
- branch choices
- penalties
- puzzle metadata
- final answer metadata

This will make balancing and iteration much easier.

Possible direction:

```ts
type MazeCheckpoint = {
  id: string;
  promptCiphertext: string;
  correctChoice: string;
  wrongChoiceIds: string[];
  rewardLetter?: string;
  penaltySeconds?: number;
};
```

Do not lock the codebase into this exact type prematurely, but prefer this style of architecture.

---

## Code Quality Standards

### Prefer
- small focused modules
- descriptive naming
- reusable UI components
- scene-specific logic separated from shared systems
- explicit state transitions
- typed data structures

### Avoid
- giant monolithic scene files
- hardcoded magic values everywhere
- tightly coupling rendering and puzzle logic
- inconsistent naming
- fragile global state

### Comments
Use comments sparingly and intentionally.
Comment:
- non-obvious game logic
- puzzle encoding/decoding rules
- important design constraints

Do not comment obvious code.

---

## Testing Expectations

This is a game project, so testing includes both:
- technical correctness
- gameplay feel

### Technical Testing
Verify:
- scene transitions
- timer correctness
- penalty correctness
- puzzle unlock flow
- no dead-end broken states
- replayability after reset

### Gameplay Testing
Verify:
- instructions are understandable
- clues are readable
- timing pressure feels fair
- wrong choices feel consequential but not devastating
- mini-puzzle and maze difficulty are balanced

When possible, preserve lightweight manual test procedures in `/progress` or `/docs`.

---

## Performance Expectations

The project does not need AAA optimization, but it should:
- load quickly
- feel responsive
- avoid unnecessary heavy rendering
- run smoothly in a desktop browser

Do not overengineer performance too early, but do avoid obviously wasteful patterns.

---

## Accessibility and Readability

Even if full accessibility support is not implemented initially, prioritize:
- large readable text
- high contrast where needed
- clear affordances
- input simplicity
- non-ambiguous visual feedback

The game should be playable by a first-time user without verbal explanation.

---

## Content Safety / IP Guidance

This project is **inspired by Harry Potter and the Goblet of Fire**, especially the Triwizard maze and magical tournament framing.

Use thematic inspiration carefully.

Prefer:
- original art/assets
- original UI
- original puzzle text
- references through atmosphere and setup rather than copying protected text verbatim

Do not paste long copyrighted passages or directly reproduce book text unnecessarily.

---

## Task Execution Policy for Codex

When implementing new features:

1. Read relevant docs first.
2. Inspect current code before changing architecture.
3. Make the smallest clean change that advances the project.
4. Keep the game runnable.
5. Update progress docs where appropriate.

When uncertain:
- prefer the clearest implementation
- leave concise notes
- do not stall progress unnecessarily

If asked to implement a feature that depends on missing design details:
- make reasonable assumptions
- implement a flexible version
- document the assumptions

---

## Suggested Working Rhythm

When building features, use this workflow:

1. inspect current repo state
2. inspect `AGENTS.md`
3. inspect relevant docs
4. determine the narrowest useful next milestone
5. implement
6. test locally if possible
7. summarize changes
8. update progress notes

---

## Milestone Guidance

Good early milestones include:

### Milestone 1
Basic Phaser app shell with:
- boot
- title screen
- scene switching
- placeholder theme styling

### Milestone 2
Run state system with:
- timer
- penalties
- restart flow
- finish flow

### Milestone 3
Mini-puzzle vertical slice that outputs a key

### Milestone 4
Maze vertical slice with:
- at least 3 checkpoints
- clue display
- path selection
- wrong/correct feedback

### Milestone 5
Real cipher integration between mini-puzzle and maze

### Milestone 6
Polish pass and content expansion

---

## Definition of Success

A successful build is one where a new player can:
1. launch the game
2. understand the goal
3. solve the key puzzle
4. decode maze clues
5. make route decisions
6. reach the finish
7. compare completion time with others
8. want to try again for a better run

---

## Immediate Next Priority

Unless newer documentation overrides this, the immediate next priority after repository setup should be:

**Build a vertical slice with one complete playable loop:**
- title
- intro
- mini-puzzle
- maze with a few checkpoints
- timer
- finish screen

That loop matters more than broad content expansion.

---

## Documentation Expectations

The `/docs` folder should eventually contain concise, implementation-oriented documentation such as:
- game overview
- gameplay loop
- puzzle specification
- UI specification
- visual direction
- implementation roadmap

These docs should help Codex build correctly without repeated high-level prompting.

---

## Final Instruction

When in doubt, optimize for:
- playability
- clarity
- modularity
- speed of iteration
- preserving the intended puzzle-race structure
