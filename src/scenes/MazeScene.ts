import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import { mazeCheckpoints, MazeChoice } from '../data/mazeCheckpoints';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton, TextButton } from '../ui/button';
import { createPanel } from '../ui/panel';
import { RunHud } from '../ui/runHud';

export class MazeScene extends Phaser.Scene {
  private hud!: RunHud;
  private checkpointIndex = 0;
  private checkpointTitleText!: Phaser.GameObjects.Text;
  private flavorText!: Phaser.GameObjects.Text;
  private clueText!: Phaser.GameObjects.Text;
  private decoderText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private previewLabels: Phaser.GameObjects.Text[] = [];
  private choiceButtons: TextButton[] = [];

  constructor() {
    super(SCENE_KEYS.MAZE);
  }

  create(): void {
    const snapshot = runState.getSnapshot();

    if (!snapshot.active && snapshot.finalTimeMs === null) {
      runState.startRun();
    }

    runState.setPhase('maze');
    drawSceneBackdrop(this);

    const { width } = this.scale;
    this.hud = new RunHud(this, 'Phase 2: Maze Run');

    if (!runState.hasUnlockedKey()) {
      this.renderLockedState(width);
      return;
    }

    createPanel(this, 382, 502, 560, 620, {
      label: 'Maze Vista',
      fillAlpha: 0.9
    });
    createPanel(this, 1058, 474, 592, 564, {
      label: 'Cipher Marker',
      fillAlpha: 0.92
    });
    createPanel(this, width / 2, 810, 1240, 120, {
      label: 'Route Feedback',
      fillAlpha: 0.92
    });

    this.checkpointTitleText = this.add
      .text(118, 176, '', {
        fontFamily: THEME.fonts.display,
        fontSize: '48px',
        color: THEME.css.parchment
      })
      .setOrigin(0, 0.5);

    this.flavorText = this.add
      .text(118, 230, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.mist,
        wordWrap: { width: 480 },
        lineSpacing: 8
      })
      .setOrigin(0, 0);

    this.previewGraphics = this.add.graphics();

    this.clueText = this.add
      .text(804, 216, '', {
        fontFamily: THEME.fonts.display,
        fontSize: '60px',
        color: THEME.css.gold
      })
      .setOrigin(0, 0.5);

    this.decoderText = this.add
      .text(804, 282, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '26px',
        color: THEME.css.parchment,
        wordWrap: { width: 500 },
        lineSpacing: 10
      })
      .setOrigin(0, 0);

    this.feedbackText = this.add
      .text(width / 2, 818, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '26px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 1120 },
        lineSpacing: 8
      })
      .setOrigin(0.5);

    this.showCheckpoint(0);
  }

  update(): void {
    this.hud.refresh();
  }

  private renderLockedState(width: number): void {
    createPanel(this, width / 2, 470, 920, 340, {
      label: 'Maze Seal',
      fillAlpha: 0.92
    });

    this.add
      .text(width / 2, 348, 'The hedge markers remain sealed.', {
        fontFamily: THEME.fonts.display,
        fontSize: '58px',
        color: THEME.css.parchment
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        470,
        'You have not earned the cipher key yet. Return to the artifact chamber, complete the rune sequence, and bring the key into the maze before the markers can be read.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '28px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 760 },
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    createTextButton(this, width / 2, 614, 320, 74, 'Return to the Egg', () => {
      this.scene.start(SCENE_KEYS.MINI_PUZZLE);
    });
  }

  private showCheckpoint(index: number): void {
    const checkpoint = mazeCheckpoints[index];
    this.checkpointIndex = index;
    runState.setCheckpointProgress(index + 1, mazeCheckpoints.length);

    this.checkpointTitleText.setText(checkpoint.title);
    this.flavorText.setText(checkpoint.flavorText);
    this.clueText.setText(checkpoint.ciphertext);
    this.decoderText.setText(
      `Recovered key: ${runState.getSnapshot().keyWord}\nThe marker only responds because the key was earned in the egg chamber.\n\nTemporary attunement reading for this milestone: ${checkpoint.decodedCommand}\nThe full cipher interaction will replace this provisional translation next.`
    );
    this.feedbackText.setText('Choose a route. Wrong turns add time but keep the run alive.');

    this.renderMazePreview();
    this.renderChoices(checkpoint.choices);
  }

  private renderMazePreview(): void {
    const total = mazeCheckpoints.length;
    const activeY = 352 + this.checkpointIndex * 90;

    this.previewGraphics.clear();
    this.previewGraphics.lineStyle(10, THEME.colors.moss, 0.9);
    this.previewGraphics.strokeRoundedRect(166, 330, 430, 250, 28);
    this.previewGraphics.lineStyle(14, THEME.colors.gold, 0.24);
    this.previewGraphics.strokeCircle(374, activeY, 44);
    this.previewGraphics.lineStyle(8, THEME.colors.gold, 0.5);
    this.previewGraphics.beginPath();
    this.previewGraphics.moveTo(374, 620);
    this.previewGraphics.lineTo(374, 360);
    this.previewGraphics.moveTo(374, 520);
    this.previewGraphics.lineTo(296, 454);
    this.previewGraphics.moveTo(374, 442);
    this.previewGraphics.lineTo(452, 390);
    this.previewGraphics.strokePath();

    this.previewLabels.forEach((label) => label.destroy());
    this.previewLabels = [];

    for (let index = 0; index < total; index += 1) {
      const y = 352 + index * 90;
      const isActive = index === this.checkpointIndex;
      const isCleared = index < this.checkpointIndex;

      this.previewGraphics.fillStyle(
        isActive ? THEME.colors.gold : isCleared ? THEME.colors.success : THEME.colors.panelAlt,
        1
      );
      this.previewGraphics.fillCircle(374, y, 20);
      this.previewLabels.push(
        this.add
          .text(430, y, `Marker ${index + 1}`, {
            fontFamily: THEME.fonts.body,
            fontSize: '24px',
            color: isActive ? THEME.css.parchment : THEME.css.mist
          })
          .setOrigin(0, 0.5)
      );
    }
  }

  private renderChoices(choices: MazeChoice[]): void {
    this.choiceButtons.forEach((button) => button.destroy());
    this.choiceButtons = [];

    choices.forEach((choice, index) => {
      const button = createTextButton(
        this,
        1080,
        462 + index * 110,
        500,
        82,
        choice.label,
        () => this.resolveChoice(choice)
      );
      this.choiceButtons.push(button);
    });
  }

  private resolveChoice(choice: MazeChoice): void {
    if (choice.isCorrect) {
      this.cameras.main.flash(150, 212, 177, 90, false);

      if (this.checkpointIndex === mazeCheckpoints.length - 1) {
        runState.completeRun();
        this.scene.start(SCENE_KEYS.RESULTS);
        return;
      }

      this.showCheckpoint(this.checkpointIndex + 1);
      this.feedbackText.setText(choice.feedbackText);
      return;
    }

    const penaltyMs = choice.penaltyMs ?? 5000;
    runState.recordWrongTurn();
    runState.addPenalty(penaltyMs);
    this.feedbackText.setText(`${choice.feedbackText} Penalty applied: ${formatPenalty(penaltyMs)}.`);
    this.cameras.main.shake(130, 0.0025);
  }
}
