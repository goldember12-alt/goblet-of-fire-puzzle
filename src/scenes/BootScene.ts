import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    runState.reset();
    drawSceneBackdrop(this);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 28, 'Conjuring the Maze', {
        fontFamily: THEME.fonts.display,
        fontSize: '58px',
        color: THEME.css.parchment
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 34, 'Preparing the first playable trial shell...', {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.mist
      })
      .setOrigin(0.5);

    this.time.delayedCall(300, () => {
      this.scene.start(SCENE_KEYS.TITLE);
    });
  }
}
