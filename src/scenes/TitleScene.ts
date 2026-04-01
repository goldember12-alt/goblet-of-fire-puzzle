import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton } from '../ui/button';
import { createPanel } from '../ui/panel';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  create(): void {
    runState.reset();
    runState.setPhase('title');
    drawSceneBackdrop(this);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, 144, 'Triwizard Maze Run', {
        fontFamily: THEME.fonts.display,
        fontSize: '76px',
        color: THEME.css.parchment,
        stroke: '#3e2c10',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        214,
        'A fast, readable puzzle-race through an enchanted hedge trial',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '28px',
          color: THEME.css.mist
        }
      )
      .setOrigin(0.5);

    createPanel(this, width / 2, height / 2 + 34, 880, 340, {
      label: 'Prototype Scope',
      fillAlpha: 0.9
    });

    this.add
      .text(
        width / 2,
        height / 2 - 18,
        'This first vertical slice focuses on structure over full puzzle depth:\n\n- Title to results flow\n- Timer and penalties\n- Placeholder key-unlock interaction\n- Data-driven maze checkpoint shell',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '28px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 760 },
          lineSpacing: 10
        }
      )
      .setOrigin(0.5);

    createTextButton(
      this,
      width / 2,
      height - 150,
      280,
      76,
      'Start Trial',
      () => this.scene.start(SCENE_KEYS.INTRO)
    );

    this.add
      .text(
        width / 2,
        height - 80,
        'Desktop-first Phaser shell. The real mini-puzzle and cipher logic come next.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.mist
        }
      )
      .setOrigin(0.5);
  }
}
