# Content and Data Model

## Goal
Keep puzzle and maze content data-driven where practical so the game can be balanced without rewriting scene logic.

---

## Suggested Data Categories

### Run Config
May contain:
- default penalties
- hint penalties
- timer settings
- default final answer requirements

### Mini-Puzzle Data
May contain:
- puzzle id
- puzzle type
- symbol set
- solution state
- output keyword
- hint rules

### Maze Checkpoint Data
Each checkpoint should ideally define:
- id
- ciphertext
- decoded meaning
- available choices
- correct choice id
- wrong choice outcomes
- time penalty values
- reward letter
- flavor or environmental metadata

### Results Data
Can summarize:
- total time
- wrong turns
- hints used
- letters collected
- final answer submitted

---

## Example Type Sketches

```ts
export type RunStats = {
  elapsedMs: number;
  penaltyMs: number;
  wrongTurns: number;
  hintsUsed: number;
  checkpointsCleared: number;
};

export type MiniPuzzleResult = {
  solved: boolean;
  keyWord: string;
  attempts: number;
  hintsUsed: number;
};

export type MazeChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
  penaltyMs?: number;
  nextCheckpointId?: string;
  feedbackText?: string;
};

export type MazeCheckpoint = {
  id: string;
  ciphertext: string;
  decodedCommand: string;
  choices: MazeChoice[];
  rewardLetter?: string;
  flavorText?: string;
};
```

These are examples, not mandatory final shapes.

---

## Content Storage Recommendation
Prefer lightweight structured files or modules such as:
- `.ts` data modules for early development,
- later possibly `.json` if easier for content editing.

## Authoring Principles
- keep content readable,
- separate puzzle data from rendering logic,
- avoid burying all gameplay in one massive scene file.

## Balancing Advantage
Data-driven content makes it easier to tune:
- clue difficulty,
- penalties,
- route length,
- reward letters,
- alternate modes.
