# Triwizard Maze Run

A browser-based puzzle-race game inspired by the mood and structure of **Harry Potter and the Goblet of Fire**.

Players compete for the fastest completion time by:
1. solving a short mini-puzzle to unlock a cipher key,
2. entering an enchanted hedge maze,
3. decoding encrypted checkpoint clues,
4. choosing the correct path,
5. reaching the Cup before anyone else.

This repository is intended to be built as a **Phaser + TypeScript** browser game, with **Codex** used as the primary implementation agent.

---

## Project Goal

Build a polished single-player browser game with a strong replay loop:

- **unlock the key**
- **decode under pressure**
- **navigate the maze**
- **finish with the best time**

The game should feel:
- tense
- magical
- readable
- raceable
- replayable

---

## Core Gameplay Structure

The intended run loop is:

1. **Title / Start**
2. **Brief intro**
3. **Mini-puzzle to reveal cipher key**
4. **Maze run with checkpoint decisions**
5. **Results screen with completion time**

### Key design constraints
- the timer matters
- the maze decisions matter
- the cipher key must be earned
- the game should not rely on Harry Potter trivia
- wrong choices should generally cost time, not hard-reset the run

---

## Repository Docs

This repo is designed to be driven by documentation first.

### Read in this order
1. `AGENTS.md`
2. files in `/docs`
3. current code structure

### Included docs
- `docs/game-overview.md`
- `docs/gameplay-loop.md`
- `docs/puzzle-spec.md`
- `docs/ui-spec.md`
- `docs/visual-direction.md`
- `docs/implementation-roadmap.md`
- `docs/content-data-model.md`
- `docs/testing-plan.md`

These files define the intended experience, architecture direction, and milestone order.

---

## Recommended Stack

- **Phaser**
- **TypeScript**
- **Vite** or comparable modern dev setup
- browser-first deployment

Desktop browser is the initial target platform.

---

## Recommended First Build

The first goal is **not** a full finished game.

The first goal is a **vertical slice** with one complete playable loop:
- title screen
- intro
- mini-puzzle
- small maze section
- timer
- results screen

A smaller polished prototype is better than a larger broken one.

---

## Proposed Repository Shape

```text
/
  AGENTS.md
  README.md
  /docs
  /progress
  /src
    /core
    /scenes
    /systems
    /ui
    /puzzles
    /data
    /assets
```

This does not need to exist immediately in final form, but structure should remain intentional.

---

## Setup Notes

The cleanest setup is:

1. create a new local project folder
2. place `AGENTS.md` at repo root
3. place the documentation bundle in `/docs`
4. scaffold a Phaser + TypeScript project
5. use Codex to implement the game milestone by milestone

---

## Development Priorities

### Phase 1
Get the app booting and scene transitions working.

### Phase 2
Add run state and timer logic.

### Phase 3
Implement the mini-puzzle vertical slice.

### Phase 4
Implement a small playable maze with checkpoint decisions.

### Phase 5
Integrate the real cipher logic between the mini-puzzle and maze.

### Phase 6
Polish the experience and expand content.

---

## Content Direction

The game should evoke:
- magical tournament atmosphere
- hedge-maze tension
- enchanted puzzle-solving
- elegant fantasy presentation

The game should avoid:
- trivia dependence
- overcomplicated controls
- cluttered UI
- giant monolithic scene logic

---

## Working With Codex

This repo is meant to work well with Codex.

### Best practice
- keep docs concise and specific
- define milestones clearly
- ask for small, testable increments
- keep the game runnable after each milestone
- update progress notes as the project evolves

A good Codex workflow is:
1. inspect `AGENTS.md`
2. inspect `/docs`
3. scaffold or inspect current repo
4. implement the narrowest useful next milestone
5. test
6. summarize changes

---

## Immediate Next Step

After placing the repo files, the immediate task should be:

**Scaffold a Phaser + TypeScript project and build the first vertical slice shell.**

That means:
- app boots
- title screen exists
- scene flow exists
- timer scaffolding exists
- placeholder styling exists

---

## Definition of Success

The project is on track when a new player can:
1. start the game,
2. understand the objective quickly,
3. solve the key-unlock mini-puzzle,
4. decode clues,
5. make maze decisions,
6. finish the run,
7. immediately want to replay for a better time.
