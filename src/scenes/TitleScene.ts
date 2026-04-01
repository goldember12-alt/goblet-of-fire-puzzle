import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import {
  createButton,
  createButtonRow,
  createPanel,
  createStatStrip,
  el
} from '../ui/domUi';
import { overlayController, type OverlayViewHandle } from '../ui/overlay';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

export class TitleScene extends Phaser.Scene {
  private overlay?: OverlayViewHandle;

  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  create(): void {
    runState.reset();
    runState.setPhase('title');
    drawSceneBackdrop(this);
    this.drawWorldFraming();
    playSceneEnter(this);
    this.createOverlay();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.overlay?.destroy();
      this.overlay = undefined;
    });
  }

  private createOverlay(): void {
    this.overlay = overlayController.show(this.scene.key, {
      layout: 'center',
      sceneClass: 'scene-title'
    });

    const startButton = createButton({
      label: 'Enter Briefing',
      onClick: () => fadeToScene(this, SCENE_KEYS.INTRO)
    });

    const actionRow = createButtonRow(startButton);
    const pillars = createStatStrip([
      { key: 'key', label: 'Phase 1', value: 'Unlock the Egg', accent: 'gold' },
      { key: 'maze', label: 'Phase 2', value: 'Decode the Maze' },
      { key: 'timer', label: 'Goal', value: 'Beat Your Time', accent: 'success' }
    ]);

    const featureGrid = el('div', 'ui-card-grid');
    featureGrid.append(
      createPanel(
        { title: 'Recover the Key' },
        el(
          'p',
          'ui-panel__description',
          'Solve the Golden Egg sequence to earn the keyword that makes the hedge markers readable.'
        )
      ),
      createPanel(
        { title: 'Decode Under Pressure' },
        el(
          'p',
          'ui-panel__description',
          'Carry the keyword into the maze, repeat it beneath each clue, and confirm the command before you move.'
        )
      ),
      createPanel(
        { title: 'Race the Clock' },
        el(
          'p',
          'ui-panel__description',
          'Hints, wrong decodes, and bad branches all cost time, so the cleanest run wins.'
        )
      )
    );

    const heroPanel = createPanel(
      { className: 'title-hero' },
      el('div', 'ui-panel__eyebrow', 'Triwizard Tournament Trial'),
      el('h1', 'ui-hero-title', 'Triwizard Maze Run'),
      el(
        'p',
        'ui-hero-subtitle',
        'Unlock the Golden Egg, decode the hedge markers, and reach the Cup with the fastest clean line you can manage.'
      ),
      pillars.root,
      featureGrid,
      el(
        'p',
        'ui-note',
        'The timer begins from the briefing screen, so this title overlay stays purely for orientation and atmosphere.'
      ),
      actionRow
    );

    this.overlay.main.append(heroPanel);
  }

  private drawWorldFraming(): void {
    const graphics = this.add.graphics();
    const glow = this.add.ellipse(0, 0, 0, 0, 0xd4b15a, 0.12);
    const cup = this.add.graphics();

    const redraw = () => {
      const { width, height } = this.scale;

      graphics.clear();
      cup.clear();

      graphics.lineStyle(18, 0x214b34, 0.85);
      graphics.strokeRoundedRect(width * 0.13, height * 0.16, width * 0.46, height * 0.66, 34);
      graphics.lineStyle(10, 0x214b34, 0.7);
      graphics.strokeRoundedRect(width * 0.17, height * 0.22, width * 0.38, height * 0.54, 28);

      for (let index = 0; index < 6; index += 1) {
        const x = width * 0.16 + index * width * 0.075;
        graphics.fillStyle(0x10291c, 0.5);
        graphics.fillRoundedRect(x, height * 0.24, width * 0.045, height * 0.5, 18);
      }

      glow.setPosition(width * 0.36, height * 0.38).setSize(width * 0.16, height * 0.16);

      cup.fillStyle(0xd4b15a, 0.95);
      cup.fillRoundedRect(width * 0.33, height * 0.32, width * 0.06, height * 0.1, 10);
      cup.fillTriangle(
        width * 0.315,
        height * 0.33,
        width * 0.405,
        height * 0.33,
        width * 0.36,
        height * 0.22
      );
      cup.fillRoundedRect(width * 0.355, height * 0.42, width * 0.01, height * 0.06, 4);
      cup.fillRoundedRect(width * 0.335, height * 0.48, width * 0.05, height * 0.02, 6);
    };

    redraw();

    const resizeHandler = () => redraw();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }
}
