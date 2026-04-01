# Game Overview

## Working Title
**Triwizard Maze Run**

## High Concept
A browser-based timed puzzle-race game inspired by the mood and structure of *Harry Potter and the Goblet of Fire*.

Players compete for the fastest completion time by:
1. solving a short mini-puzzle to unlock a cipher key,
2. entering a hedge maze,
3. decoding encrypted clues at checkpoints,
4. choosing the correct direction to reach the Cup.

## Core Fantasy
The player is a tournament champion navigating an enchanted hedge maze under time pressure. The maze does not reward random wandering. Progress depends on unlocking and correctly applying a magical cipher system.

## Player Goals
- finish as quickly as possible,
- avoid wrong turns and penalties,
- understand the puzzle system quickly,
- improve on repeat runs.

## Design Pillars
- **Raceable:** best time matters.
- **Readable:** players always know what to do next.
- **Clever:** difficulty comes from reasoning, not obscurity.
- **Atmospheric:** strong magical tournament mood.
- **Replayable:** players can improve with practice.

## Intended Session Length
Target a full run length of roughly **3 to 6 minutes** for a first complete version.

## Core Loop
1. Read brief intro.
2. Start timer.
3. Solve mini-puzzle to reveal cipher key.
4. Enter maze.
5. Decode checkpoint clue.
6. Choose path.
7. Advance or take penalty.
8. Reach Cup.
9. View results and restart.

## Win Condition
A run is complete when the player:
- reaches the final maze destination,
- and satisfies any final validation step required by the current design.

## Failure / Penalty Model
Prefer **time penalties** over hard failure states.
Examples:
- wrong turn costs time,
- dead end costs time,
- hint usage costs time.

Avoid punitive full restarts unless explicitly enabled as a special mode.

## Scope Goal for Initial Prototype
Create a polished vertical slice with:
- title screen,
- intro screen,
- mini-puzzle,
- 3 to 5 maze checkpoints,
- timer,
- wrong/correct route feedback,
- finish screen.
