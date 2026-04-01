# Testing Plan

## Testing Goals
Verify both:
1. the game works correctly,
2. the game feels fair and understandable.

---

## Manual Test Categories

### 1. Boot / Flow Tests
Confirm:
- game loads,
- title screen appears,
- start button works,
- intro flow works,
- transitions do not soft-lock.

### 2. Timer Tests
Confirm:
- timer starts at intended moment,
- timer continues through scenes if intended,
- penalties are applied correctly,
- final time includes penalties correctly,
- restart resets everything.

### 3. Mini-Puzzle Tests
Confirm:
- puzzle can be solved,
- wrong interactions do not break state,
- hints work if present,
- key reveal triggers correctly,
- solved state transitions correctly.

### 4. Maze Tests
Confirm:
- ciphertext displays correctly,
- movement choices render correctly,
- correct choice advances,
- wrong choice penalizes,
- no checkpoint becomes unreachable due to a bug,
- finish state always resolves.

### 5. Results Tests
Confirm:
- final time displays,
- wrong turns display,
- restart works from results,
- repeated runs do not retain stale state.

---

## Gameplay Feel Tests

### Readability
Check:
- can a first-time player understand the goal quickly?
- is the clue text readable?
- are movement choices clear?

### Difficulty
Check:
- is the mini-puzzle too slow or too easy?
- are early checkpoints teachable?
- do later checkpoints feel tense but fair?

### Feedback
Check:
- do players notice mistakes immediately?
- does solving feel rewarding?
- are penalties understandable?

---

## Suggested Playtest Questions
After a test run, ask:
- What confused you first?
- Did you know what to do in the mini-puzzle?
- Did the maze choices feel fair?
- Were the clues readable?
- Did the timer feel motivating or stressful in a bad way?
- Would you replay to improve your time?

---

## Bug Severity Guidance
### Critical
- game cannot complete
- scene soft-lock
- timer broken
- run state corrupted

### Major
- checkpoint logic wrong
- penalties misapplied
- puzzle output incorrect
- restart inconsistent

### Minor
- visual overlap
- feedback timing roughness
- cosmetic issues
- non-blocking layout bugs

---

## Definition of a Good Vertical Slice
The vertical slice is successful if a tester can:
- start the game,
- solve the mini-puzzle,
- make at least several maze decisions,
- finish the run,
- understand why they got their time,
- immediately want another attempt.
