import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatDuration, formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton } from '../ui/button';
import { fitIntoBox, getSceneLayoutMetrics } from '../ui/layout';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

const SUMMARY_BASE = { width: 920, height: 640 };

export class ResultsScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private summaryPanel!: Phaser.GameObjects.Rectangle;
  private summaryLabel!: Phaser.GameObjects.Text;
  private summaryContent!: Phaser.GameObjects.Container;
  private timeText!: Phaser.GameObjects.Text;
  private performanceText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private splitsHeaderText!: Phaser.GameObjects.Text;
  private splitsText!: Phaser.GameObjects.Text;
  private footerText!: Phaser.GameObjects.Text;
  private playAgainButton!: ReturnType<typeof createTextButton>;

  constructor() {
    super(SCENE_KEYS.RESULTS);
  }

  create(): void {
    runState.setPhase('results');
    const snapshot = runState.getSnapshot();
    const performanceSummary = this.getPerformanceSummary(snapshot);
    const splitLines = snapshot.checkpointSplits
      .map(
        (split) =>
          `${split.checkpointNumber}. ${split.title.replace(/^Checkpoint [IVX]+:\s*/, '')}  ${formatDuration(
            split.elapsedMs
          )}  (${formatPenalty(split.splitMs)})`
      )
      .join('\n');

    drawSceneBackdrop(this);
    playSceneEnter(this);

    this.titleText = this.add.text(0, 0, 'Trial Complete', {
      fontFamily: THEME.fonts.display,
      fontSize: '70px',
      color: THEME.css.parchment
    });

    this.subtitleText = this.add.text(
      0,
      0,
      'You cleared the hedge trial. Every penalty still counted, and a cleaner replay can still beat this time.',
      {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.mist,
        align: 'center'
      }
    );

    this.summaryPanel = this.add
      .rectangle(0, 0, SUMMARY_BASE.width, SUMMARY_BASE.height, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.summaryLabel = this.add.text(0, 0, 'Run Summary', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.summaryContent = this.add.container(0, 0);
    this.timeText = this.add
      .text(0, -204, formatDuration(snapshot.elapsedMs), {
        fontFamily: THEME.fonts.display,
        fontSize: '78px',
        color: THEME.css.gold
      })
      .setOrigin(0.5);
    this.performanceText = this.add
      .text(0, -140, performanceSummary, {
        fontFamily: THEME.fonts.body,
        fontSize: '22px',
        color: THEME.css.gold,
        align: 'center',
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);
    this.statsText = this.add
      .text(
        0,
        -36,
        `Penalty Time: ${formatPenalty(snapshot.penaltyMs)}   |   Wrong Turns: ${snapshot.wrongTurns}\nMini-Puzzle Attempts: ${snapshot.miniPuzzleAttempts}   |   Hints Used: ${snapshot.hintsUsed}\nMarkers Cleared: ${snapshot.currentCheckpoint}/${snapshot.totalCheckpoints}   |   Key: ${snapshot.keyWord ?? 'None'}`,
        {
          fontFamily: THEME.fonts.body,
          fontSize: '23px',
          color: THEME.css.parchment,
          align: 'center',
          lineSpacing: 10
        }
      )
      .setOrigin(0.5);
    this.splitsHeaderText = this.add
      .text(0, 82, 'Checkpoint Splits', {
        fontFamily: THEME.fonts.display,
        fontSize: '30px',
        color: THEME.css.parchment
      })
      .setOrigin(0.5);
    this.splitsText = this.add
      .text(0, 194, splitLines || 'No marker splits were recorded.', {
        fontFamily: THEME.fonts.body,
        fontSize: '18px',
        color: THEME.css.mist,
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);
    this.footerText = this.add
      .text(
        0,
        302,
        'Replay goal: shave time by solving earlier, taking fewer penalties, and carrying the decoder rhythm through the late markers.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '18px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 680 },
          lineSpacing: 5
        }
      )
      .setOrigin(0.5);

    this.summaryContent.add([
      this.timeText,
      this.performanceText,
      this.statsText,
      this.splitsHeaderText,
      this.splitsText,
      this.footerText
    ]);

    this.playAgainButton = createTextButton(this, 0, 0, 300, 76, 'Play Again', () => {
      fadeToScene(this, SCENE_KEYS.TITLE, () => {
        runState.reset();
      });
    });

    this.layoutScene();
    this.tweens.add({
      targets: [this.timeText, this.summaryPanel],
      scaleX: 1.02,
      scaleY: 1.02,
      yoyo: true,
      duration: 240
    });

    const resizeHandler = () => this.layoutScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  private layoutScene(): void {
    const metrics = getSceneLayoutMetrics(this);
    const summaryWidth = Math.min(920, metrics.usableWidth);
    const summaryHeight = Math.min(680, metrics.usableHeight - metrics.headerHeight - 54);
    const panelY = metrics.contentTop + summaryHeight / 2 - 8;
    const scale = fitIntoBox(
      SUMMARY_BASE.width,
      SUMMARY_BASE.height,
      summaryWidth - 30,
      summaryHeight - 38,
      1
    );

    this.titleText.setPosition(metrics.width / 2, metrics.padding + 22).setOrigin(0.5);
    this.subtitleText
      .setPosition(metrics.width / 2, metrics.padding + 84)
      .setOrigin(0.5)
      .setWordWrapWidth(Math.min(820, metrics.usableWidth - 80));

    this.summaryPanel.setPosition(metrics.width / 2, panelY).setSize(summaryWidth, summaryHeight);
    this.summaryLabel.setPosition(metrics.width / 2 - summaryWidth / 2 + 18, panelY - summaryHeight / 2 + 14);
    this.summaryContent.setPosition(metrics.width / 2, panelY + 8).setScale(scale);

    this.playAgainButton.setPosition(metrics.width / 2, metrics.height - metrics.padding - 36);
  }

  private getPerformanceSummary(snapshot: ReturnType<typeof runState.getSnapshot>): string {
    if (snapshot.wrongTurns === 0 && snapshot.hintsUsed === 0) {
      return 'Clean route. The maze never forced you to recover.';
    }

    if (snapshot.wrongTurns <= 1 && snapshot.penaltyMs <= 15000) {
      return 'Strong pace. A cleaner final line could still drop this time noticeably.';
    }

    return 'Recoverable run. Most of the remaining time is still hidden in wrong turns and penalties.';
  }
}
