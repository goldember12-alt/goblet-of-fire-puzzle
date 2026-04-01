import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton, type TextButton } from '../ui/button';
import { fitIntoBox, getSceneLayoutMetrics } from '../ui/layout';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

const BRIEFING_BASE = { width: 690, height: 430 };
const PRIMER_BASE = { width: 390, height: 430 };

export class IntroScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
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

    this.subtitleText = this.add.text(
      0,
      0,
      'Earn the key, read the markers, and keep your route clean enough to chase a best time.',
      {
        fontFamily: THEME.fonts.body,
        fontSize: '25px',
        color: THEME.css.mist,
        align: 'center',
        lineSpacing: 6
      }
    );

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
        -160,
        'Each phase teaches the next one. Solve the artifact first so the hedge markers become readable under pressure.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '24px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 560 },
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    const steps = [
      {
        y: -36,
        step: '1',
        title: 'Unlock the Egg',
        body: 'Arrange the five rune fragments until every omen card agrees and the keyword is revealed.'
      },
      {
        y: 84,
        step: '2',
        title: 'Read the Marker',
        body: 'Repeat the keyword under the ciphertext, shift backward by each shown amount, and uncover the route word.'
      },
      {
        y: 204,
        step: '3',
        title: 'Choose Fast',
        body: 'Pick the matching route. Wrong turns and hints cost time, so cleaner runs beat merely correct ones.'
      }
    ];

    steps.forEach((step) => {
      const badge = this.add
        .circle(-270, step.y, 32, THEME.colors.moss, 1)
        .setStrokeStyle(2, THEME.colors.gold, 0.45);
      const stepText = this.add
        .text(-270, step.y, step.step, {
          fontFamily: THEME.fonts.display,
          fontSize: '30px',
          color: THEME.css.parchment
        })
        .setOrigin(0.5);
      const title = this.add
        .text(-210, step.y - 24, step.title, {
          fontFamily: THEME.fonts.display,
          fontSize: '28px',
          color: THEME.css.gold
        })
        .setOrigin(0, 0.5);
      const body = this.add
        .text(-210, step.y + 18, step.body, {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.mist,
          wordWrap: { width: 460 },
          lineSpacing: 6
        })
        .setOrigin(0, 0.5);

      this.briefingContent.add([badge, stepText, title, body]);
    });

    this.briefingContent.add(introText);
  }

  private buildPrimerContent(): void {
    const headline = this.add
      .text(0, -162, 'First marker onboarding', {
        fontFamily: THEME.fonts.display,
        fontSize: '34px',
        color: THEME.css.parchment,
        align: 'center'
      })
      .setOrigin(0.5);

    const helperBackground = this.add
      .rectangle(0, -28, 298, 166, THEME.colors.panelAlt, 0.96)
      .setStrokeStyle(2, THEME.colors.gold, 0.28);
    const helperText = this.add
      .text(
        0,
        -28,
        'Cipher\nR C M M\n\nKey\nT R I W\n\nShift\n-19 -17 -8 -22',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '24px',
          color: THEME.css.parchment,
          align: 'center',
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    const notes = this.add
      .text(
        0,
        128,
        'The first checkpoint is intentionally short so you can learn the decoder rhythm before the run asks for speed. Click letters or type directly into the decode row.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '19px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 300 },
          lineSpacing: 6
        }
      )
      .setOrigin(0.5);

    this.primerContent.add([headline, helperBackground, helperText, notes]);
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
    this.subtitleText
      .setPosition(metrics.width / 2, metrics.padding + 86)
      .setOrigin(0.5)
      .setWordWrapWidth(Math.min(920, metrics.usableWidth - 60));

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
      this.briefingContent.setPosition(metrics.width / 2, firstPanelY + 8).setScale(briefingScale);

      this.primerPanel.setPosition(metrics.width / 2, secondPanelY).setSize(rightWidth, panelHeight);
      this.primerLabel.setPosition(metrics.width / 2 - rightWidth / 2 + 18, secondPanelY - panelHeight / 2 + 14);
      this.primerContent.setPosition(metrics.width / 2, secondPanelY + 8).setScale(primerScale);
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
      this.briefingContent.setPosition(leftX, topY + 8).setScale(briefingScale);

      this.primerPanel.setPosition(rightX, topY).setSize(rightWidth, panelHeight);
      this.primerLabel.setPosition(rightX - rightWidth / 2 + 18, topY - panelHeight / 2 + 14);
      this.primerContent.setPosition(rightX, topY + 8).setScale(primerScale);
    }

    this.timerNoteText
      .setPosition(metrics.width / 2, metrics.height - metrics.padding - 106)
      .setOrigin(0.5)
      .setWordWrapWidth(Math.min(860, metrics.usableWidth - 60));

    this.backButton.setPosition(metrics.width / 2 - 170, metrics.height - metrics.padding - 42);
    this.beginButton.setPosition(metrics.width / 2 + 170, metrics.height - metrics.padding - 40);
  }
}
