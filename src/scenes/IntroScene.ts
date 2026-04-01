import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton } from '../ui/button';
import { createPanel } from '../ui/panel';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.INTRO);
  }

  create(): void {
    runState.setPhase('intro');
    drawSceneBackdrop(this);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, 120, 'The Third Trial Awaits', {
        fontFamily: THEME.fonts.display,
        fontSize: '60px',
        color: THEME.css.parchment
      })
      .setOrigin(0.5);

    createPanel(this, width / 2, 300, 980, 230, {
      label: 'Briefing',
      fillAlpha: 0.9
    });

    this.add
      .text(
        width / 2,
        310,
        'The Cup rests somewhere inside the hedge maze. The route markers are encoded, and the timer begins the moment you commit to the trial. Earn the key first, then use it to guide each turn.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '30px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 860 },
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    createPanel(this, width * 0.28, 570, 340, 220, {
      label: 'Phase 1'
    });
    createPanel(this, width * 0.5, 570, 340, 220, {
      label: 'Phase 2'
    });
    createPanel(this, width * 0.72, 570, 340, 220, {
      label: 'Phase 3'
    });

    this.add
      .text(width * 0.28, 580, 'Unlock the key\nwith a magical artifact puzzle.', {
        fontFamily: THEME.fonts.body,
        fontSize: '26px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 250 }
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.5, 580, 'Decode checkpoint markers\nand choose the right path.', {
        fontFamily: THEME.fonts.body,
        fontSize: '26px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 250 }
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.72, 580, 'Finish fast, avoid penalties,\nand study the results.', {
        fontFamily: THEME.fonts.body,
        fontSize: '26px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 250 }
      })
      .setOrigin(0.5);

    createTextButton(this, width / 2 - 170, height - 108, 220, 70, 'Back', () => {
      this.scene.start(SCENE_KEYS.TITLE);
    });

    createTextButton(this, width / 2 + 170, height - 108, 320, 70, 'Begin Trial', () => {
      runState.startRun();
      this.scene.start(SCENE_KEYS.MINI_PUZZLE);
    });

    this.add
      .text(width / 2, height - 48, 'The timer starts when you begin the trial.', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold
      })
      .setOrigin(0.5);
  }
}
