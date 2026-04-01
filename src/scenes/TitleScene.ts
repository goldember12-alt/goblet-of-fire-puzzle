import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton, type TextButton } from '../ui/button';
import { fitIntoBox, getSceneLayoutMetrics } from '../ui/layout';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

const FEATURE_PANEL_BASE = { width: 980, height: 390 };

export class TitleScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private featurePanel!: Phaser.GameObjects.Rectangle;
  private featureLabel!: Phaser.GameObjects.Text;
  private featureContent!: Phaser.GameObjects.Container;
  private footerText!: Phaser.GameObjects.Text;
  private briefingButton!: TextButton;

  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  create(): void {
    runState.reset();
    runState.setPhase('title');
    drawSceneBackdrop(this);
    playSceneEnter(this);

    this.titleText = this.add.text(0, 0, 'Triwizard Maze Run', {
      fontFamily: THEME.fonts.display,
      fontSize: '78px',
      color: THEME.css.parchment,
      stroke: '#3e2c10',
      strokeThickness: 3
    });

    this.subtitleText = this.add.text(
      0,
      0,
      'A dark-fantasy puzzle race through a keyed hedge trial',
      {
        fontFamily: THEME.fonts.body,
        fontSize: '28px',
        color: THEME.css.mist,
        lineSpacing: 6
      }
    );

    this.featurePanel = this.add
      .rectangle(0, 0, FEATURE_PANEL_BASE.width, FEATURE_PANEL_BASE.height, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);

    this.featureLabel = this.add.text(0, 0, 'Trial Overview', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.featureContent = this.add.container(0, 0);
    this.buildFeatureContent();

    this.footerText = this.add.text(
      0,
      0,
      'Timer note: your run begins from the briefing screen, not from this title screen.',
      {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold,
        align: 'center'
      }
    );

    this.briefingButton = createTextButton(this, 0, 0, 320, 74, 'Enter Briefing', () => {
      fadeToScene(this, SCENE_KEYS.INTRO);
    });

    this.layoutScene();

    const resizeHandler = () => this.layoutScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  private buildFeatureContent(): void {
    const overline = this.add
      .text(0, -148, 'One readable run. One earned key. One faster replay after another.', {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);

    const pitch = this.add
      .text(
        0,
        -88,
        'Unlock the Golden Egg, decode hedge markers with the recovered keyword, and reach the Cup before penalties drag down your time.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '28px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 820 },
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    const cards = [
      {
        x: -300,
        title: 'Recover the Key',
        body: 'Solve the rune sequence to earn the keyword that makes the maze readable.'
      },
      {
        x: 0,
        title: 'Decode Fast',
        body: 'Use the key and shift aid to turn each marker into a short route command.'
      },
      {
        x: 300,
        title: 'Beat the Clock',
        body: 'Wrong turns and hints cost time, so a clean run matters as much as a correct one.'
      }
    ];

    cards.forEach((card) => {
      const background = this.add
        .rectangle(card.x, 48, 264, 186, THEME.colors.panelAlt, 0.96)
        .setStrokeStyle(2, THEME.colors.gold, 0.28);
      const title = this.add
        .text(card.x, -4, card.title, {
          fontFamily: THEME.fonts.display,
          fontSize: '30px',
          color: THEME.css.parchment,
          align: 'center'
        })
        .setOrigin(0.5);
      const body = this.add
        .text(card.x, 70, card.body, {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 214 },
          lineSpacing: 6
        })
        .setOrigin(0.5);

      this.featureContent.add([background, title, body]);
    });

    this.featureContent.add([overline, pitch]);
  }

  private layoutScene(): void {
    const metrics = getSceneLayoutMetrics(this);
    const panelWidth = Math.min(1040, metrics.usableWidth);
    const panelHeight = Math.min(430, metrics.usableHeight - metrics.headerHeight - 90);
    const panelY = metrics.contentTop + panelHeight / 2 - 8;
    const scale = fitIntoBox(
      FEATURE_PANEL_BASE.width,
      FEATURE_PANEL_BASE.height,
      panelWidth - 34,
      panelHeight - 40,
      1
    );

    this.titleText.setPosition(metrics.width / 2, metrics.padding + 22).setOrigin(0.5);
    this.subtitleText
      .setPosition(metrics.width / 2, metrics.padding + 90)
      .setOrigin(0.5)
      .setWordWrapWidth(Math.min(900, metrics.usableWidth - 80));

    this.featurePanel.setPosition(metrics.width / 2, panelY).setSize(panelWidth, panelHeight);
    this.featureLabel.setPosition(metrics.width / 2 - panelWidth / 2 + 18, panelY - panelHeight / 2 + 14);
    this.featureContent.setPosition(metrics.width / 2, panelY + 6).setScale(scale);

    this.briefingButton.setPosition(metrics.width / 2, metrics.height - metrics.padding - 46);
    this.footerText
      .setPosition(metrics.width / 2, metrics.height - metrics.padding - 102)
      .setOrigin(0.5)
      .setWordWrapWidth(Math.min(860, metrics.usableWidth - 60));
  }
}
