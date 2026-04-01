# UI Specification

## UI Goals
The UI should be:
- clear under time pressure,
- readable on desktop browser,
- atmospheric but not cluttered,
- fast to interact with.

## Global HUD
The following should remain visible during active gameplay where appropriate:
- timer
- current phase
- key status
- checkpoint progress
- penalty feedback

---

## Screen List

### 1. Title Screen
Elements:
- game title
- subtitle or one-line pitch
- Start button
- optional secondary buttons: Instructions, Credits, Settings

### 2. Intro Screen
Elements:
- short flavor text
- short gameplay explanation
- Begin Trial button
- Skip/continue behavior should be simple

### 3. Mini-Puzzle Screen
Elements:
- artifact-focused central play area
- short objective text
- visual puzzle components
- key reveal area
- optional hint button
- timer visible

### 4. Maze Screen
This is the most important screen.

#### Layout Recommendation
Use a **two-panel layout**:

**Left / center:**
- maze view or checkpoint path view
- player marker
- animated environmental feedback

**Right or bottom panel:**
- encoded clue
- optional decoder aid
- movement options
- feedback text

#### Required Maze UI Elements
- current ciphertext clue
- movement choice buttons
- timer
- checkpoint number or route progress
- unlocked key display or access button
- wrong/correct feedback area

### 5. Results Screen
Elements:
- final time
- penalty summary
- wrong turns
- restart / play again
- optional shareable summary text

---

## Interaction Model

### Preferred Input Methods
- mouse
- touch
- keyboard support where easy

### Strong Recommendation
Avoid requiring lots of typing during the maze.
Prefer:
- clicking directional choices,
- selecting route options,
- confirming decisions quickly.

---

## Readability Rules
- use large text for clues and choices,
- maintain high contrast,
- keep explanatory text short,
- avoid burying important information.

---

## Feedback Rules

### Correct Action Feedback
Could include:
- green/gold glow
- opening path
- soft magical sound
- progress update

### Wrong Action Feedback
Could include:
- hedge slam
- red flash or withered glow
- penalty popup
- short warning sound

### Key Unlock Feedback
This should feel like a reward moment:
- artifact glows,
- letters align,
- key appears clearly,
- transition to maze feels exciting.

---

## Responsive Design
Desktop-first is preferred for the first version.

Mobile support is a secondary goal.
If mobile is supported, maintain:
- large tap targets,
- readable clue panel,
- no precision dragging unless carefully designed.
