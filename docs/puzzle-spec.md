# Puzzle Specification

## Overall Structure
The game contains two puzzle layers:

1. a **mini-puzzle** that reveals the cipher key,
2. a **maze clue system** that uses the unlocked key.

Both puzzles should be:
- self-contained,
- fair,
- understandable,
- independent of Harry Potter trivia knowledge.

---

## Mini-Puzzle Spec

### Purpose
Reveal the key used in the maze cipher.

### Requirements
The mini-puzzle must:
- be solvable by logic/pattern recognition,
- not require outside knowledge,
- be learnable quickly,
- feel magical and distinct from the maze.

### Candidate Formats
Preferred options:
1. **Rune matching puzzle**
2. **Rotating ring puzzle**
3. **Fragment ordering puzzle**
4. **Symbol-to-letter deduction puzzle**

### Recommended Direction
Start with a **fragment ordering or rune deduction** puzzle because it is:
- readable,
- digital-friendly,
- implementable without heavy custom interaction tech.

### Output
The mini-puzzle should output:
- `keyWord: string`
- `solved: boolean`
- optional metadata like time used, hints used, number of attempts

### Difficulty Target
Strong first-time player solve: **30–90 seconds**

---

## Maze Cipher Spec

### Purpose
Convert the unlocked key into actionable route choices.

### Requirements
The maze cipher must:
- use the unlocked key meaningfully,
- support short clues,
- be applied repeatedly under time pressure,
- lead directly to movement decisions.

### Recommended Cipher Direction
Use a **keyed substitution or Vigenère-like system** adapted for short commands.

Examples of outputs after decoding:
- LEFT
- RIGHT
- FORWARD
- EAST
- SOUTH
- TAKE LEFT PATH

Avoid extremely long outputs.

### Clue Length
Target clue length:
- early game: 4–6 letters
- mid game: 5–8 letters
- late game: 6–10 letters

### Checkpoint Design
Each checkpoint should contain:
- checkpoint id
- ciphertext
- possible choices
- correct choice
- penalty for wrong choice
- optional reward letter

### Final Extraction
A recommended structure:
- correct checkpoints award letters,
- letters form a final answer,
- final answer may confirm success.

Example final answers:
- `PORTKEY`
- `CUP`
- another original in-universe answer

### Anti-Bruteforce Measures
Use one or more of:
- final answer validation,
- meaningful wrong-turn penalties,
- non-obvious but fair branching,
- partial clue reveal only after checkpoint entry.

---

## Hints
Hints should be optional and cost time.
Recommended hint types:
- highlight key usage,
- partially decode a clue,
- eliminate one wrong route.

---

## Balancing Rules
Puzzle difficulty should come from:
- recognition,
- reasoning,
- time pressure.

Puzzle difficulty should not come from:
- tiny unreadable text,
- arbitrary click hunting,
- hidden rules,
- impossible first-time inference.
