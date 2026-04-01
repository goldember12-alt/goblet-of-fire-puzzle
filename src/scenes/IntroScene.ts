import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import {
  createButton,
  createButtonRow,
  createPanel,
  createTutorialBox,
  el
} from '../ui/domUi';
import { overlayController, type OverlayViewHandle } from '../ui/overlay';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

const buildStepCard = (step: string, title: string, body: string): HTMLElement => {
  const card = el('article', 'ui-step-card');
  const badge = el('div', 'ui-step-card__badge', step);
  const copy = el('div');

  copy.append(el('h3', 'ui-step-card__title', title), el('p', 'ui-step-card__body', body));
  card.append(badge, copy);
  return card;
};

export class IntroScene extends Phaser.Scene {
  private overlay?: OverlayViewHandle;

  constructor() {
    super(SCENE_KEYS.INTRO);
  }

  create(): void {
    runState.setPhase('intro');
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
      sceneClass: 'scene-intro'
    });

    const steps = el('div');
    steps.append(
      buildStepCard('1', 'Solve the Egg', 'Arrange the five rune fragments until every omen card agrees.'),
      buildStepCard(
        '2',
        'Decode the Marker',
        'Repeat the keyword beneath the ciphertext and move backward by each shown amount.'
      ),
      buildStepCard(
        '3',
        'Choose the Route',
        'Confirm the decoded word first, then commit to the branch on that side of the hedge chamber.'
      )
    );

    const helperRows = el('div', 'decoder-grid');
    helperRows.style.setProperty('--decoder-columns', '4');

    const rows = [
      ['Cipher', 'E', 'V', 'N', 'P'],
      ['Key', 'T', 'R', 'I', 'W'],
      ['Back', '19', '17', '8', '22'],
      ['Decode', 'L', 'E', 'F', 'T']
    ];

    rows.forEach(([label, ...values], rowIndex) => {
      helperRows.append(el('div', 'decoder-label', label));
      values.forEach((value) => {
        helperRows.append(
          el(
            'div',
            `decoder-cell${rowIndex === 0 ? ' decoder-cell--cipher' : ''}${
              rowIndex === 2 ? ' decoder-cell--shift' : ''
            }`,
            value
          )
        );
      });
    });

    const flowPanel = createPanel(
      {
        eyebrow: 'Trial Flow',
        title: 'The Third Trial Awaits',
        description:
          'Solve the egg first, carry its keyword into the maze, then decode each marker before the hedges can force a bad turn.'
      },
      steps
    );

    const primerPanel = createPanel(
      {
        eyebrow: 'Maze Primer',
        title: 'How the first marker works',
        description:
          'A = 0. Example: E is 4 and T is 19, so move backward 19 steps from E to wrap around to L.'
      },
      helperRows,
      createTutorialBox(
        'What to do',
        'Fill the decoder row, press Confirm Decode, then choose the branch on that side of the chamber.'
      )
    );

    const contentGrid = el('div', 'ui-two-column');
    contentGrid.append(flowPanel, primerPanel);

    const backButton = createButton({
      label: 'Back',
      tone: 'ghost',
      onClick: () => fadeToScene(this, SCENE_KEYS.TITLE)
    });

    const beginButton = createButton({
      label: 'Begin Trial',
      onClick: () =>
        fadeToScene(this, SCENE_KEYS.MINI_PUZZLE, () => {
          runState.startRun();
        })
    });

    const shell = createPanel(
      { className: 'intro-shell' },
      contentGrid,
      el('p', 'ui-note', 'The timer starts when you press Begin Trial.'),
      createButtonRow(backButton, beginButton)
    );

    this.overlay.main.append(shell);
  }

  private drawWorldFraming(): void {
    const graphics = this.add.graphics();
    const moonGlow = this.add.ellipse(0, 0, 0, 0, 0xb9c3af, 0.08);

    const redraw = () => {
      const { width, height } = this.scale;

      graphics.clear();
      moonGlow.setPosition(width * 0.22, height * 0.22).setSize(width * 0.12, width * 0.12);

      graphics.lineStyle(14, 0x214b34, 0.76);
      graphics.strokeRoundedRect(width * 0.08, height * 0.12, width * 0.34, height * 0.72, 28);
      graphics.strokeRoundedRect(width * 0.58, height * 0.16, width * 0.24, height * 0.6, 28);

      graphics.fillStyle(0x10291c, 0.48);
      graphics.fillEllipse(width * 0.24, height * 0.68, width * 0.22, height * 0.3);
      graphics.fillEllipse(width * 0.7, height * 0.64, width * 0.16, height * 0.26);

      graphics.fillStyle(0xd4b15a, 0.16);
      graphics.fillEllipse(width * 0.7, height * 0.48, width * 0.11, height * 0.12);
      graphics.fillStyle(0xeadcb0, 0.08);
      graphics.fillEllipse(width * 0.7, height * 0.48, width * 0.06, height * 0.08);
    };

    redraw();

    const resizeHandler = () => redraw();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }
}
