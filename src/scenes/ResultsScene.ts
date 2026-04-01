import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatDuration, formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton } from '../ui/button';
import { createPanel } from '../ui/panel';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.RESULTS);
  }

  create(): void {
    runState.setPhase('results');
    const snapshot = runState.getSnapshot();

    drawSceneBackdrop(this);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, 112, 'Trial Complete', {
        fontFamily: THEME.fonts.display,
        fontSize: '70px',
        color: THEME.css.parchment
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 182, 'The Cup is within reach. The next milestone can now deepen the puzzle layer.', {
        fontFamily: THEME.fonts.body,
        fontSize: '26px',
        color: THEME.css.mist
      })
      .setOrigin(0.5);

    createPanel(this, width / 2, 444, 860, 430, {
      label: 'Run Summary',
      fillAlpha: 0.92
    });

    this.add
      .text(width / 2, 316, formatDuration(snapshot.elapsedMs), {
        fontFamily: THEME.fonts.display,
        fontSize: '84px',
        color: THEME.css.gold
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        468,
        `Penalty Time: ${formatPenalty(snapshot.penaltyMs)}\nMini-Puzzle Attempts: ${snapshot.miniPuzzleAttempts}\nWrong Turns: ${snapshot.wrongTurns}\nCheckpoint Progress: ${snapshot.currentCheckpoint}/${snapshot.totalCheckpoints}\nUnlocked Key: ${snapshot.keyWord ?? 'None'}\nHints Used: ${snapshot.hintsUsed}`,
        {
          fontFamily: THEME.fonts.body,
          fontSize: '30px',
          color: THEME.css.parchment,
          align: 'center',
          lineSpacing: 16
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        632,
        'Current shell behavior: a real rune-ordering mini-puzzle, a key-gated maze shell, and a temporary clue translation layer.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '22px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 700 }
        }
      )
      .setOrigin(0.5);

    createTextButton(this, width / 2, height - 118, 300, 76, 'Play Again', () => {
      runState.reset();
      this.scene.start(SCENE_KEYS.TITLE);
    });
  }
}
