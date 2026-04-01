import Phaser from 'phaser';
import { THEME } from '../core/theme';
import { formatDuration, formatPenalty } from '../core/time';
import { runState } from '../systems/RunState';
import { createPanel } from './panel';

export class RunHud {
  private readonly phaseText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly keyText: Phaser.GameObjects.Text;
  private readonly metaText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, phaseLabel: string) {
    const { width } = scene.scale;
    const panelWidth = 392;
    const panelHeight = 142;
    const panelX = width - panelWidth / 2 - 34;
    const panelY = panelHeight / 2 + 28;

    createPanel(scene, panelX, panelY, panelWidth, panelHeight, {
      label: 'Run Ledger',
      fillAlpha: 0.92
    });

    this.phaseText = scene.add
      .text(panelX - panelWidth / 2 + 22, panelY - 38, phaseLabel, {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.mist,
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    this.timerText = scene.add
      .text(panelX - panelWidth / 2 + 22, panelY - 2, '00:00.0', {
        fontFamily: THEME.fonts.display,
        fontSize: '42px',
        color: THEME.css.parchment
      })
      .setOrigin(0, 0.5);

    this.keyText = scene.add
      .text(panelX - panelWidth / 2 + 22, panelY + 40, 'Key: Locked', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold
      })
      .setOrigin(0, 0.5);

    this.metaText = scene.add
      .text(panelX - panelWidth / 2 + 22, panelY + 72, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '18px',
        color: THEME.css.mist,
        wordWrap: { width: panelWidth - 44 }
      })
      .setOrigin(0, 0.5);
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
}
