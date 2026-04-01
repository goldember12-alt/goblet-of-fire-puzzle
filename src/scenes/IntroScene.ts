import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton, type TextButton } from '../ui/button';
import { fitIntoBox, getSceneLayoutMetrics } from '../ui/layout';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

const BRIEFING_BASE = { width: 690, height: 408 };
const PRIMER_BASE = { width: 390, height: 408 };

export class IntroScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private briefingPanel!: Phaser.GameObjects.Rectangle;
  private briefingLabel!: Phaser.GameObjects.Text;
  private briefingContent!: Phaser.GameObjects.Container;
  private primerPanel!: Phaser.GameObjects.Rectangle;
  private primerLabel!: Phaser.GameObjects.Text;
  private primerContent!: Phaser.GameObjects.Container;
  private timerNoteText!: Phaser.GameObjects.Text;
  private backButton!: TextButton;
  private beginButton!: TextButton;

  constructor() {
    super(SCENE_KEYS.INTRO);
  }

  create(): void {
    runState.setPhase('intro');
    drawSceneBackdrop(this);
    playSceneEnter(this);

    this.titleText = this.add.text(0, 0, 'The Third Trial Awaits', {
      fontFamily: THEME.fonts.display,
      fontSize: '66px',
      color: THEME.css.parchment
    });

    this.briefingPanel = this.add
      .rectangle(0, 0, BRIEFING_BASE.width, BRIEFING_BASE.height, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.briefingLabel = this.add.text(0, 0, 'Trial Flow', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });
    this.briefingContent = this.add.container(0, 0);
    this.buildBriefingContent();

    this.primerPanel = this.add
      .rectangle(0, 0, PRIMER_BASE.width, PRIMER_BASE.height, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.primerLabel = this.add.text(0, 0, 'Maze Primer', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });
    this.primerContent = this.add.container(0, 0);
    this.buildPrimerContent();

    this.timerNoteText = this.add.text(0, 0, 'The timer starts when you press Begin Trial.', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      align: 'center'
    });

    this.backButton = createTextButton(this, 0, 0, 220, 68, 'Back', () => {
      fadeToScene(this, SCENE_KEYS.TITLE);
    });

    this.beginButton = createTextButton(this, 0, 0, 320, 72, 'Begin Trial', () => {
      fadeToScene(this, SCENE_KEYS.MINI_PUZZLE, () => {
        runState.startRun();
      });
    });

    this.layoutScene();

    const resizeHandler = () => this.layoutScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  private buildBriefingContent(): void {
    const introText = this.add
      .text(
        0,
        -142,
        'Solve the egg first, carry its keyword into the maze, then decode each marker before the hedges can force a bad turn.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 530 },
          lineSpacing: 6
        }
      )
      .setOrigin(0.5);

    const steps = [
      {
        y: -62,
        step: '1',
        title: 'Solve the Egg',
        body: 'Arrange the five rune fragments until every omen card agrees and the keyword is revealed.'
      },
      {
        y: 42,
        step: '2',
        title: 'Decode the Marker',
        body: 'Repeat the keyword under the ciphertext, move backward by each shown amount, and reveal the route command.'
      },
      {
        y: 146,
        step: '3',
        title: 'Choose the Route',
        body: 'Confirm the decoded word, then take the matching branch before wrong turns and hint penalties erode your time.'
      }
    ];

    steps.forEach((step) => {
      const badge = this.add
        .circle(-266, step.y + 10, 28, THEME.colors.moss, 1)
        .setStrokeStyle(2, THEME.colors.gold, 0.45);
      const stepText = this.add
        .text(-266, step.y + 10, step.step, {
          fontFamily: THEME.fonts.display,
          fontSize: '28px',
          color: THEME.css.parchment
        })
        .setOrigin(0.5);
      const title = this.add
        .text(-210, step.y - 14, step.title, {
          fontFamily: THEME.fonts.display,
          fontSize: '24px',
          color: THEME.css.gold
        })
        .setOrigin(0, 0);
      const body = this.add
        .text(-210, step.y + 16, step.body, {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.css.mist,
          wordWrap: { width: 436 },
          lineSpacing: 4
        })
        .setOrigin(0, 0);

      this.briefingContent.add([badge, stepText, title, body]);
    });

    this.briefingContent.add(introText);
  }

  private buildPrimerContent(): void {
    const headline = this.add
      .text(0, -156, 'How the first marker works', {
        fontFamily: THEME.fonts.display,
        fontSize: '31px',
        color: THEME.css.parchment,
        align: 'center'
      })
      .setOrigin(0.5);

    const helperBackground = this.add
      .rectangle(0, -38, 314, 176, THEME.colors.panelAlt, 0.96)
      .setStrokeStyle(2, THEME.colors.gold, 0.28);
    const helperText = this.add
      .text(
        0,
        -48,
        'Cipher  E V N P\nKey     T R I W\nBack    19 17  8 22\nDecode  L E F T',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.parchment,
          align: 'center',
          lineSpacing: 10
        }
      )
      .setOrigin(0.5);

    const exampleText = this.add
      .text(
        0,
        46,
        'A = 0. Example: E is 4 and T is 19, so move backward 19 steps from E to wrap around to L.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.css.gold,
          align: 'center',
          wordWrap: { width: 282 },
          lineSpacing: 4
        }
      )
      .setOrigin(0.5);

    const notes = this.add
      .text(
        0,
        144,
        'Repeat the keyword beneath the clue, fill the decoder row, press Confirm Decode, then choose the branch on that side of the maze.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '17px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 298 },
          lineSpacing: 5
        }
      )
      .setOrigin(0.5);

    this.primerContent.add([headline, helperBackground, helperText, exampleText, notes]);
  }

  private layoutScene(): void {
    const metrics = getSceneLayoutMetrics(this);
    const stacked = metrics.usableWidth < 1140;
    const panelGap = metrics.gap;
    const panelHeight = stacked
      ? Math.min(330, Math.floor((metrics.contentBottom - metrics.contentTop - panelGap) / 2))
      : Math.min(450, metrics.contentBottom - metrics.contentTop);
    const leftWidth = stacked
      ? metrics.usableWidth
      : Phaser.Math.Clamp(Math.round(metrics.usableWidth * 0.62), 600, 760);
    const rightWidth = stacked ? metrics.usableWidth : metrics.usableWidth - leftWidth - panelGap;
    const topY = metrics.contentTop + panelHeight / 2;

    this.titleText.setPosition(metrics.width / 2, metrics.padding + 20).setOrigin(0.5);

    if (stacked) {
      const firstPanelY = metrics.contentTop + panelHeight / 2 - 6;
      const secondPanelY = firstPanelY + panelHeight / 2 + panelGap + panelHeight / 2;
      const briefingScale = fitIntoBox(
        BRIEFING_BASE.width,
        BRIEFING_BASE.height,
        leftWidth - 34,
        panelHeight - 38,
        1
      );
      const primerScale = fitIntoBox(
        PRIMER_BASE.width,
        PRIMER_BASE.height,
        rightWidth - 34,
        panelHeight - 38,
        1
      );

      this.briefingPanel.setPosition(metrics.width / 2, firstPanelY).setSize(leftWidth, panelHeight);
      this.briefingLabel.setPosition(metrics.width / 2 - leftWidth / 2 + 18, firstPanelY - panelHeight / 2 + 14);
      this.briefingContent.setPosition(metrics.width / 2, firstPanelY + 6).setScale(briefingScale);

      this.primerPanel.setPosition(metrics.width / 2, secondPanelY).setSize(rightWidth, panelHeight);
      this.primerLabel.setPosition(metrics.width / 2 - rightWidth / 2 + 18, secondPanelY - panelHeight / 2 + 14);
      this.primerContent.setPosition(metrics.width / 2, secondPanelY + 6).setScale(primerScale);
    } else {
      const leftX = metrics.padding + leftWidth / 2;
      const rightX = leftX + leftWidth / 2 + panelGap + rightWidth / 2;
      const briefingScale = fitIntoBox(
        BRIEFING_BASE.width,
        BRIEFING_BASE.height,
        leftWidth - 34,
        panelHeight - 38,
        1
      );
      const primerScale = fitIntoBox(
        PRIMER_BASE.width,
        PRIMER_BASE.height,
        rightWidth - 34,
        panelHeight - 38,
        1
      );

      this.briefingPanel.setPosition(leftX, topY).setSize(leftWidth, panelHeight);
      this.briefingLabel.setPosition(leftX - leftWidth / 2 + 18, topY - panelHeight / 2 + 14);
      this.briefingContent.setPosition(leftX, topY + 6).setScale(briefingScale);

      this.primerPanel.setPosition(rightX, topY).setSize(rightWidth, panelHeight);
      this.primerLabel.setPosition(rightX - rightWidth / 2 + 18, topY - panelHeight / 2 + 14);
      this.primerContent.setPosition(rightX, topY + 6).setScale(primerScale);
    }

    this.timerNoteText
      .setPosition(metrics.width / 2, metrics.height - metrics.padding - 106)
      .setOrigin(0.5)
      .setWordWrapWidth(Math.min(860, metrics.usableWidth - 60));

    this.backButton.setPosition(metrics.width / 2 - 170, metrics.height - metrics.padding - 42);
    this.beginButton.setPosition(metrics.width / 2 + 170, metrics.height - metrics.padding - 40);
  }
}
