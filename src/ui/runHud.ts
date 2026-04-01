import Phaser from 'phaser';
import { THEME } from '../core/theme';
import { formatDuration, formatPenalty } from '../core/time';
import { runState } from '../systems/RunState';
import { getSceneLayoutMetrics } from './layout';

export class RunHud {
  private readonly scene: Phaser.Scene;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly phaseText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly keyText: Phaser.GameObjects.Text;
  private readonly metaText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, phaseLabel: string) {
    this.scene = scene;

    this.panel = scene.add
      .rectangle(0, 0, 0, 0, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);

    this.labelText = scene.add.text(0, 0, 'Run Ledger', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.phaseText = scene.add
      .text(0, 0, phaseLabel, {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.mist,
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    this.timerText = scene.add
      .text(0, 0, '00:00.0', {
        fontFamily: THEME.fonts.display,
        fontSize: '42px',
        color: THEME.css.parchment
      })
      .setOrigin(0, 0.5);

    this.keyText = scene.add
      .text(0, 0, 'Key: Locked', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold
      })
      .setOrigin(0, 0.5);

    this.metaText = scene.add
      .text(0, 0, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '18px',
        color: THEME.css.mist,
        wordWrap: { width: 320 }
      })
      .setOrigin(0, 0.5);

    this.layout();

    const resizeHandler = () => this.layout();
    scene.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  refresh(): void {
    const snapshot = runState.getSnapshot();
    const metaText =
      snapshot.phase === 'mini-puzzle'
        ? `Penalties ${formatPenalty(snapshot.penaltyMs)}  |  Hints ${snapshot.hintsUsed}  |  Attempts ${snapshot.miniPuzzleAttempts}`
        : `Penalties ${formatPenalty(snapshot.penaltyMs)}  |  Hints ${snapshot.hintsUsed}  |  Wrong turns ${snapshot.wrongTurns}  |  ${
            snapshot.totalCheckpoints > 0
              ? `${snapshot.currentCheckpoint}/${snapshot.totalCheckpoints} checkpoints`
              : 'Awaiting maze entry'
          }`;

    this.timerText.setText(formatDuration(snapshot.elapsedMs));
    this.keyText.setText(`Key: ${snapshot.keyWord ?? 'Locked'}`);
    this.metaText.setText(metaText);
  }

  private layout(): void {
    const metrics = getSceneLayoutMetrics(this.scene);
    const panelWidth = Phaser.Math.Clamp(Math.round(metrics.width * 0.28), 320, 420);
    const panelHeight = metrics.isCompact ? 130 : 142;
    const panelX = metrics.width - metrics.padding - panelWidth / 2;
    const panelY = metrics.padding + panelHeight / 2;
    const textLeft = panelX - panelWidth / 2 + 18;

    this.panel.setPosition(panelX, panelY).setSize(panelWidth, panelHeight);
    this.labelText.setPosition(textLeft, panelY - panelHeight / 2 + 14);
    this.phaseText.setPosition(textLeft, panelY - 34);
    this.timerText.setPosition(textLeft, panelY - 2);
    this.keyText.setPosition(textLeft, panelY + 34);
    this.metaText.setPosition(textLeft, panelY + 62).setWordWrapWidth(panelWidth - 34);
  }
}
