# Gameplay Loop

## Overview
The game has two main puzzle phases and one results phase:

1. **Key Unlock**
2. **Maze Run**
3. **Results**

## Detailed Loop

### 1. Title / Start
The player lands on the title screen and can:
- start the game,
- optionally view short instructions,
- optionally toggle audio or accessibility settings later in development.

### 2. Intro
The intro should be short and skippable. It should explain:
- the Cup is hidden in the maze,
- the hedge markers are encoded,
- the key must be earned first,
- the timer determines performance.

### 3. Key Unlock Phase
The timer may either:
- begin at the start of the mini-puzzle, or
- begin on the first player input after the intro.

Preferred default: **timer begins when the run starts**, so the mini-puzzle matters in the race.

The player solves a self-contained mini-puzzle that reveals a keyword such as:
- `TRIWIZARD`
- `HORNTAIL`
- `PORTKEY` (only if not also used as the final answer)

Once solved:
- reveal the key with a strong magical feedback moment,
- store the key in run state,
- transition directly into the maze.

### 4. Maze Phase
The maze is built around a sequence of meaningful checkpoints.

At each checkpoint:
1. show encoded clue,
2. allow the player to think or use decoder aid,
3. present movement choices,
4. resolve the selected path.

Possible movement choices:
- left / right / forward
- north / east / south / west
- labeled corridor choices

Correct choice:
- advance to next checkpoint,
- play positive feedback,
- possibly award a progress letter.

Wrong choice:
- play negative feedback,
- apply time penalty,
- send player into a dead end or force recovery.

### 5. Final Step
At the final checkpoint or goal:
- reveal the Cup,
- optionally require a final extracted answer,
- end run only when completion criteria are satisfied.

### 6. Results
Show:
- total time,
- penalties,
- wrong turns,
- hints used,
- optional split times,
- restart button.

## Difficulty Curve
Recommended curve:
- mini-puzzle is moderate and teachable,
- first maze checkpoint is easy,
- mid checkpoints are moderate,
- final checkpoints are the most stressful but still fair.

## Replay Experience
A repeat player should benefit from:
- remembering the puzzle rules,
- learning route structure,
- improving decision speed.

A repeat player should **not** need to reread long instructions.
