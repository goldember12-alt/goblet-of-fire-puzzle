# Implementation Roadmap

## Goal
Build the game in small, playable increments. Keep the project runnable after every major milestone.

---

## Milestone 1: Project Shell
### Deliverables
- Phaser project boots successfully
- scene system established
- title scene created
- base styling direction established
- basic app state or run state scaffolding created

### Notes
Do not overbuild architecture before the first playable flow exists.

---

## Milestone 2: Timer + Run State
### Deliverables
- run starts cleanly
- elapsed time tracked
- penalties can be added
- restart works
- results scene can display time

### Notes
This system should become a reliable foundation for all later gameplay.

---

## Milestone 3: Mini-Puzzle Vertical Slice
### Deliverables
- one complete mini-puzzle
- solve detection
- key reveal
- transition into maze
- hint behavior if included

### Notes
Puzzle can begin with simple content and improved presentation later.

---

## Milestone 4: Maze Vertical Slice
### Deliverables
- maze scene renders
- 3 to 5 checkpoints
- clue display works
- route choice works
- wrong route penalty works
- checkpoint progression works
- finish state works

### Notes
Do not wait for the full final maze to make this playable.

---

## Milestone 5: Cipher Integration
### Deliverables
- mini-puzzle key feeds maze clue logic
- actual decoding gameplay implemented
- placeholder clue resolution removed
- player-facing decode aid refined if needed

### Notes
This milestone creates the real game identity.

---

## Milestone 6: UX / Feedback Polish
### Deliverables
- better transitions
- stronger feedback
- readable HUD
- improved effects
- improved results screen

---

## Milestone 7: Content Expansion
### Deliverables
- more checkpoints
- better balancing
- stronger thematic content
- optional accessibility and hint tuning
- more robust replayability

---

## Milestone 8: Final Packaging
### Deliverables
- stable build
- cleaned assets
- cleaned copy
- instructions finalized
- no critical broken states

---

## Suggested Development Order Within Files
Likely initial implementation priority:
1. scene boot flow
2. run state manager
3. timer UI
4. mini-puzzle scene
5. maze checkpoint data model
6. maze interaction logic
7. results scene
8. polish systems

---

## Scope Control Rules
If work begins to sprawl:
- reduce content quantity,
- keep one polished puzzle loop,
- defer optional extras,
- preserve the core race experience first.
