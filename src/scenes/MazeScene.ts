import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import {
  buildMazeRunCheckpoints,
  getMazeDifficultyLabel,
  type MazeCheckpoint,
  type MazeChoice
} from '../data/mazeCheckpoints';
import {
  cycleGuessLetter,
  cycleGuessLetterBackward,
  getKeyStream,
  getShiftFromKeyLetter
} from '../puzzles/mazeCipher';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton, type TextButton } from '../ui/button';
import { fitIntoBox, getSceneLayoutMetrics } from '../ui/layout';
import { RunHud } from '../ui/runHud';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

type DecoderColumnView = {
  cipherText: Phaser.GameObjects.Text;
  keyText: Phaser.GameObjects.Text;
  shiftText: Phaser.GameObjects.Text;
  guessBackground: Phaser.GameObjects.Rectangle;
  guessText: Phaser.GameObjects.Text;
};

type ChoiceButtonView = {
  button: TextButton;
  choice: MazeChoice;
};

const LEFT_PANEL_BASE = { width: 430, height: 640 };
const RIGHT_PANEL_BASE = { width: 720, height: 720 };

const getChoiceButtonPosition = (
  commandWord: string
): { x: number; y: number; width: number; height: number } => {
  switch (commandWord) {
    case 'LEFT':
    case 'WEST':
      return { x: -164, y: 286, width: 196, height: 70 };
    case 'RIGHT':
    case 'EAST':
      return { x: 164, y: 286, width: 196, height: 70 };
    case 'SOUTH':
      return { x: 0, y: 320, width: 220, height: 68 };
    case 'FORWARD':
    case 'NORTH':
    default:
      return { x: 0, y: 214, width: 220, height: 70 };
  }
};

const getPreviewEndpoint = (commandWord: string): Phaser.Math.Vector2 => {
  switch (commandWord) {
    case 'LEFT':
    case 'WEST':
      return new Phaser.Math.Vector2(-132, 48);
    case 'RIGHT':
    case 'EAST':
      return new Phaser.Math.Vector2(132, 48);
    case 'SOUTH':
      return new Phaser.Math.Vector2(0, 166);
    case 'FORWARD':
    case 'NORTH':
    default:
      return new Phaser.Math.Vector2(0, -118);
  }
};

const getBranchPrompt = (commandWord: string): string => {
  switch (commandWord) {
    case 'LEFT':
    case 'WEST':
      return 'left side of the chamber';
    case 'RIGHT':
    case 'EAST':
      return 'right side of the chamber';
    case 'SOUTH':
      return 'lower branch';
    case 'FORWARD':
    case 'NORTH':
    default:
      return 'upper branch';
  }
};

const getChoiceDisplayLabel = (choice: MazeChoice): string =>
  `${choice.routeSigil.icon} ${choice.routeSigil.title}\n${choice.label}`;

export class MazeScene extends Phaser.Scene {
  private hud!: RunHud;
  private checkpoints: MazeCheckpoint[] = [];
  private checkpointIndex = 0;
  private currentCheckpoint: MazeCheckpoint | null = null;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private leftPanel!: Phaser.GameObjects.Rectangle;
  private leftPanelLabel!: Phaser.GameObjects.Text;
  private rightPanel!: Phaser.GameObjects.Rectangle;
  private rightPanelLabel!: Phaser.GameObjects.Text;
  private feedbackPanel!: Phaser.GameObjects.Rectangle;
  private feedbackLabel!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private leftContent!: Phaser.GameObjects.Container;
  private rightContent!: Phaser.GameObjects.Container;
  private clueText!: Phaser.GameObjects.Text;
  private decoderBadgeText!: Phaser.GameObjects.Text;
  private decoderHelpText!: Phaser.GameObjects.Text;
  private workingDecodeText!: Phaser.GameObjects.Text;
  private routePromptText!: Phaser.GameObjects.Text;
  private confirmDecodeButton!: TextButton;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private previewLabels: Phaser.GameObjects.Text[] = [];
  private choiceButtons: ChoiceButtonView[] = [];
  private decoderColumns: DecoderColumnView[] = [];
  private decoderLabels: Phaser.GameObjects.Text[] = [];
  private decodedGuess: string[] = [];
  private selectedDecodeIndex = 0;
  private keyListener?: (event: KeyboardEvent) => void;
  private interactionLocked = false;
  private decodeConfirmed = false;

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
    playSceneEnter(this);
    this.hud = new RunHud(this, 'Phase 2: Maze Run');

    if (!runState.hasUnlockedKey()) {
      this.renderLockedState();
      return;
    }

    this.checkpoints = buildMazeRunCheckpoints();
    this.createLayout();
    this.registerKeyboardControls();
    this.layoutScene();
    this.showCheckpoint(0);

    const resizeHandler = () => this.layoutScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  update(): void {
    this.hud.refresh();
  }

  private createLayout(): void {
    this.titleText = this.add.text(0, 0, '', {
      fontFamily: THEME.fonts.display,
      fontSize: '46px',
      color: THEME.css.parchment
    });

    this.subtitleText = this.add.text(0, 0, '', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.mist,
      lineSpacing: 6
    });

    this.leftPanel = this.add
      .rectangle(0, 0, LEFT_PANEL_BASE.width, LEFT_PANEL_BASE.height, THEME.colors.panel, 0.9)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.leftPanelLabel = this.add.text(0, 0, 'Maze Vista', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.rightPanel = this.add
      .rectangle(0, 0, RIGHT_PANEL_BASE.width, RIGHT_PANEL_BASE.height, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.rightPanelLabel = this.add.text(0, 0, 'Cipher Marker', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.feedbackPanel = this.add
      .rectangle(0, 0, 0, 0, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.feedbackLabel = this.add.text(0, 0, 'Route Feedback', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });
    this.feedbackText = this.add
      .text(0, 0, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '22px',
        color: THEME.css.parchment,
        align: 'center',
        lineSpacing: 7
      })
      .setOrigin(0.5);

    this.leftContent = this.add.container(0, 0);
    this.rightContent = this.add.container(0, 0);

    this.previewGraphics = this.add.graphics();
    this.leftContent.add(this.previewGraphics);

    this.clueText = this.add
      .text(0, -258, '', {
        fontFamily: THEME.fonts.display,
        fontSize: '52px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    this.decoderBadgeText = this.add
      .text(0, -206, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '19px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    this.decoderHelpText = this.add
      .text(0, -156, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '18px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 600 },
        lineSpacing: 5
      })
      .setOrigin(0.5);
    this.workingDecodeText = this.add
      .text(0, 118, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '18px',
        color: THEME.css.mist,
        align: 'center',
        wordWrap: { width: 600 },
        lineSpacing: 5
      })
      .setOrigin(0.5);

    this.confirmDecodeButton = createTextButton(
      this,
      0,
      0,
      240,
      62,
      'Confirm Decode',
      () => this.confirmDecode(),
      { fontSize: '21px' }
    );

    this.routePromptText = this.add
      .text(0, 188, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '18px',
        color: THEME.css.gold,
        align: 'center',
        wordWrap: { width: 600 },
        lineSpacing: 5
      })
      .setOrigin(0.5);

    this.rightContent.add([
      this.clueText,
      this.decoderBadgeText,
      this.decoderHelpText,
      this.workingDecodeText,
      this.confirmDecodeButton,
      this.routePromptText
    ]);
  }

  private layoutScene(): void {
    const metrics = getSceneLayoutMetrics(this);
    const hudWidthReserve = Phaser.Math.Clamp(Math.round(metrics.width * 0.24), 320, 370) + metrics.gap;
    const titleWrapWidth = Math.max(340, metrics.width - metrics.padding * 2 - hudWidthReserve);

    this.titleText.setPosition(metrics.padding, metrics.padding + 12);
    this.subtitleText.setPosition(metrics.padding, metrics.padding + 58).setWordWrapWidth(titleWrapWidth);

    const maxRightWidth = metrics.usableWidth - 300 - metrics.gap;
    const rightWidth =
      maxRightWidth <= 520
        ? maxRightWidth
        : Phaser.Math.Clamp(Math.round(metrics.usableWidth * 0.63), 520, Math.min(840, maxRightWidth));
    const leftWidth = metrics.usableWidth - rightWidth - metrics.gap;
    const panelHeight = metrics.contentBottom - metrics.contentTop;
    const panelY = metrics.contentTop + panelHeight / 2;
    const leftX = metrics.padding + leftWidth / 2;
    const rightX = leftX + leftWidth / 2 + metrics.gap + rightWidth / 2;

    this.leftPanel.setPosition(leftX, panelY).setSize(leftWidth, panelHeight);
    this.leftPanelLabel.setPosition(leftX - leftWidth / 2 + 18, panelY - panelHeight / 2 + 14);
    this.rightPanel.setPosition(rightX, panelY).setSize(rightWidth, panelHeight);
    this.rightPanelLabel.setPosition(rightX - rightWidth / 2 + 18, panelY - panelHeight / 2 + 14);

    this.leftContent.setPosition(leftX, panelY).setScale(
      fitIntoBox(LEFT_PANEL_BASE.width, LEFT_PANEL_BASE.height, leftWidth - 28, panelHeight - 44, 1)
    );
    this.rightContent.setPosition(rightX, panelY).setScale(
      fitIntoBox(RIGHT_PANEL_BASE.width, RIGHT_PANEL_BASE.height, rightWidth - 28, panelHeight - 44, 1)
    );

    this.confirmDecodeButton.setPosition(0, 156);

    const feedbackWidth = metrics.usableWidth;
    const feedbackHeight = metrics.footerHeight;
    const feedbackY = metrics.height - metrics.padding - feedbackHeight / 2;
    this.feedbackPanel.setPosition(metrics.width / 2, feedbackY).setSize(feedbackWidth, feedbackHeight);
    this.feedbackLabel.setPosition(metrics.width / 2 - feedbackWidth / 2 + 18, feedbackY - feedbackHeight / 2 + 14);
    this.feedbackText.setPosition(metrics.width / 2, feedbackY + 6).setWordWrapWidth(feedbackWidth - 60);
  }

  private registerKeyboardControls(): void {
    if (!this.input.keyboard) {
      return;
    }

    this.keyListener = (event: KeyboardEvent) => this.handleDecoderKey(event);
    this.input.keyboard.on('keydown', this.keyListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.keyListener && this.input.keyboard) {
        this.input.keyboard.off('keydown', this.keyListener);
      }
    });
  }

  private handleDecoderKey(event: KeyboardEvent): void {
    if (!this.currentCheckpoint || !runState.hasUnlockedKey() || this.interactionLocked || this.decodeConfirmed) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      this.selectedDecodeIndex = Math.max(0, this.selectedDecodeIndex - 1);
      this.refreshDecoderGuess();
      return;
    }

    if (event.key === 'ArrowRight') {
      this.selectedDecodeIndex = Math.min(this.decodedGuess.length - 1, this.selectedDecodeIndex + 1);
      this.refreshDecoderGuess();
      return;
    }

    if (event.key === 'ArrowUp') {
      this.decodedGuess[this.selectedDecodeIndex] = cycleGuessLetter(this.decodedGuess[this.selectedDecodeIndex]);
      this.refreshDecoderGuess();
      return;
    }

    if (event.key === 'ArrowDown') {
      this.decodedGuess[this.selectedDecodeIndex] = cycleGuessLetterBackward(
        this.decodedGuess[this.selectedDecodeIndex]
      );
      this.refreshDecoderGuess();
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.decodedGuess[this.selectedDecodeIndex] = '?';
      this.refreshDecoderGuess();
      return;
    }

    if (/^[a-z]$/i.test(event.key)) {
      this.decodedGuess[this.selectedDecodeIndex] = event.key.toUpperCase();
      this.selectedDecodeIndex = Math.min(this.decodedGuess.length - 1, this.selectedDecodeIndex + 1);
      this.refreshDecoderGuess();
    }
  }

  private renderLockedState(): void {
    const metrics = getSceneLayoutMetrics(this);
    const panelWidth = Math.min(940, metrics.usableWidth);
    const panelHeight = Math.min(360, metrics.usableHeight - 80);
    const centerX = metrics.width / 2;
    const centerY = metrics.height / 2;

    const panel = this.add
      .rectangle(centerX, centerY, panelWidth, panelHeight, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);

    this.add
      .text(centerX - panelWidth / 2 + 18, centerY - panelHeight / 2 + 14, 'Maze Seal', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold,
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    this.add
      .text(centerX, centerY - 58, 'The hedge markers remain sealed.', {
        fontFamily: THEME.fonts.display,
        fontSize: '56px',
        color: THEME.css.parchment,
        align: 'center'
      })
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        centerY + 28,
        'You have not earned the cipher key yet. Return to the egg chamber, solve the rune sequence, and bring the key into the maze before the markers can be read.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '26px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: panelWidth - 80 },
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);

    createTextButton(this, centerX, centerY + panelHeight / 2 - 56, 320, 70, 'Return to the Egg', () => {
      fadeToScene(this, SCENE_KEYS.MINI_PUZZLE);
    });

    this.hud.refresh();
    panel.setDepth(0);
  }

  private showCheckpoint(index: number): void {
    const checkpoint = this.checkpoints[index];
    this.currentCheckpoint = checkpoint;
    this.checkpointIndex = index;
    this.interactionLocked = false;
    this.decodeConfirmed = false;
    this.selectedDecodeIndex = 0;
    this.decodedGuess = Array.from({ length: checkpoint.ciphertext.length }, () => '?');
    runState.setCheckpointProgress(index + 1, this.checkpoints.length);

    this.titleText.setText(checkpoint.title);
    this.subtitleText.setText(checkpoint.flavorText);
    this.clueText
      .setText(checkpoint.ciphertext)
      .setFontSize(checkpoint.ciphertext.length > 6 ? 48 : checkpoint.ciphertext.length > 5 ? 50 : 52);
    this.rightPanelLabel.setText(index === 0 ? 'Cipher Tutorial' : 'Cipher Marker');
    this.decoderBadgeText.setText(
      index === 0
        ? `Tutorial marker | Key ${runState.getSnapshot().keyWord}`
        : `${getMazeDifficultyLabel(checkpoint.difficulty)} | Key ${runState.getSnapshot().keyWord}`
    );
    this.decoderHelpText.setText(this.getDecoderHelpText());
    this.setFeedbackState('neutral', this.getNeutralFeedbackText(checkpoint));

    this.renderMazePreview();
    this.renderDecoderAid(checkpoint);
    this.renderChoices(checkpoint.choices);
    this.refreshDecoderGuess();
    this.setChoicesEnabled(false);
  }

  private renderDecoderAid(checkpoint: MazeCheckpoint): void {
    this.decoderColumns.forEach((column) => {
      column.cipherText.destroy();
      column.keyText.destroy();
      column.shiftText.destroy();
      column.guessBackground.destroy();
      column.guessText.destroy();
    });
    this.decoderColumns = [];

    this.decoderLabels.forEach((label) => label.destroy());
    this.decoderLabels = [];

    const keyStream = getKeyStream(checkpoint.ciphertext, runState.getSnapshot().keyWord ?? '');
    const count = checkpoint.ciphertext.length;
    const spacing = count > 6 ? 50 : count > 5 ? 54 : 58;
    const startX = ((count - 1) * spacing) / -2;
    const labelX = -286;

    const labels =
      this.checkpointIndex === 0
        ? [
            { text: '1 Cipher', y: -82 },
            { text: '2 Key', y: -38 },
            { text: '3 Back', y: 6 },
            { text: '4 Guess', y: 58 }
          ]
        : [
            { text: 'Cipher', y: -82 },
            { text: 'Key', y: -38 },
            { text: 'Back', y: 6 },
            { text: 'Guess', y: 58 }
          ];

    labels.forEach(({ text, y }) => {
      const label = this.add
        .text(labelX, y, text, {
          fontFamily: THEME.fonts.body,
          fontSize: '18px',
          color: THEME.css.mist
        })
        .setOrigin(0.5);
      this.decoderLabels.push(label);
      this.rightContent.add(label);
    });

    checkpoint.ciphertext.split('').forEach((character, index) => {
      const x = startX + index * spacing;
      const keyCharacter = keyStream[index];
      const shift = getShiftFromKeyLetter(keyCharacter);

      const cipherText = this.add
        .text(x, -82, character, {
          fontFamily: THEME.fonts.display,
          fontSize: '30px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);
      const keyText = this.add
        .text(x, -38, keyCharacter, {
          fontFamily: THEME.fonts.display,
          fontSize: '28px',
          color: THEME.css.parchment
        })
        .setOrigin(0.5);
      const shiftText = this.add
        .text(x, 6, `${shift}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.mist
        })
        .setOrigin(0.5);
      const guessBackground = this.add
        .rectangle(x, 58, 50, 50, THEME.colors.panelAlt, 0.96)
        .setStrokeStyle(2, THEME.colors.gold, 0.35);
      const guessText = this.add
        .text(x, 58, this.decodedGuess[index], {
          fontFamily: THEME.fonts.display,
          fontSize: '28px',
          color: THEME.css.parchment
        })
        .setOrigin(0.5);

      guessBackground.setInteractive();
      guessBackground.on('pointerdown', () => {
        if (this.decodeConfirmed || this.interactionLocked) {
          return;
        }

        if (this.selectedDecodeIndex === index) {
          this.decodedGuess[index] = cycleGuessLetter(this.decodedGuess[index]);
        } else {
          this.selectedDecodeIndex = index;
        }
        this.refreshDecoderGuess();
      });

      this.rightContent.add([cipherText, keyText, shiftText, guessBackground, guessText]);
      this.decoderColumns.push({
        cipherText,
        keyText,
        shiftText,
        guessBackground,
        guessText
      });
    });
  }

  private refreshDecoderGuess(): void {
    this.decoderColumns.forEach((column, index) => {
      const selected = index === this.selectedDecodeIndex && !this.decodeConfirmed;
      column.guessText.setText(this.decodedGuess[index]);
      column.guessBackground.setFillStyle(selected ? THEME.colors.moss : THEME.colors.panelAlt, 0.96);
      column.guessBackground.setStrokeStyle(2, THEME.colors.gold, selected ? 0.72 : 0.35);
    });

    const workingDecode = this.decodedGuess.join('');
    const complete = !workingDecode.includes('?');
    const checkpoint = this.currentCheckpoint;

    this.confirmDecodeButton.setLabel(this.decodeConfirmed ? 'Decoded' : 'Confirm Decode');
    this.confirmDecodeButton.setEnabled(complete && !this.decodeConfirmed && !this.interactionLocked);

    if (!checkpoint) {
      return;
    }

    if (this.decodeConfirmed) {
      this.workingDecodeText.setText(
        `Decoded command: ${checkpoint.decodedCommand}\nChoose the route plaque on the ${getBranchPrompt(checkpoint.decodedCommand)}.`
      );
      this.routePromptText.setText('The marker is open. Wrong branches still waste time.');
      return;
    }

    if (!complete && this.checkpointIndex === 0) {
      this.workingDecodeText.setText(
        `Working decode: ${workingDecode}\nLeft and Right move between cells. Up and Down or the mouse changes the selected letter.`
      );
      this.routePromptText.setText('The route plaques stay sealed until the marker accepts a full decode.');
      return;
    }

    if (!complete) {
      this.workingDecodeText.setText(
        `Working decode: ${workingDecode}\nFill every column, then press Confirm Decode to test the translation.`
      );
      this.routePromptText.setText('Decode first. The maze should not be guessable from the route plaques alone.');
      return;
    }

    if (workingDecode === checkpoint.decodedCommand) {
      this.workingDecodeText.setText(
        `Working decode: ${workingDecode}\nThat looks correct. Press Confirm Decode to unseal the route plaques.`
      );
      this.routePromptText.setText('A complete guess is not enough by itself. The marker must accept it first.');
      return;
    }

    this.workingDecodeText.setText(
      `Working decode: ${workingDecode}\nPress Confirm Decode to test it. Wrong translations cost time.`
    );
    this.routePromptText.setText('Route plaques remain sealed until the decoded command is correct.');
  }

  private confirmDecode(): void {
    if (!this.currentCheckpoint || this.interactionLocked) {
      return;
    }

    const workingDecode = this.decodedGuess.join('');
    if (workingDecode.includes('?')) {
      return;
    }

    if (workingDecode !== this.currentCheckpoint.decodedCommand) {
      const penaltyMs = this.checkpointIndex === 0 ? 1500 : 2500;
      runState.addPenalty(penaltyMs);
      this.setFeedbackState(
        'danger',
        `The marker rejects "${workingDecode}". Penalty applied: ${formatPenalty(penaltyMs)}.`
      );
      this.cameras.main.shake(110, 0.0018);
      this.tweens.add({
        targets: [this.rightPanel, this.confirmDecodeButton],
        alpha: 0.88,
        yoyo: true,
        duration: 120
      });
      this.refreshDecoderGuess();
      return;
    }

    this.decodeConfirmed = true;
    this.setChoicesEnabled(true);
    this.setFeedbackState(
      'success',
      `Decoded command confirmed: ${workingDecode}. Choose the route plaque on the ${getBranchPrompt(workingDecode)}.`
    );
    this.tweens.add({
      targets: this.choiceButtons.map((entry) => entry.button),
      alpha: 0.9,
      yoyo: true,
      duration: 160
    });
    this.refreshDecoderGuess();
  }

  private renderMazePreview(): void {
    const checkpoint = this.currentCheckpoint;
    if (!checkpoint) {
      return;
    }

    const hub = new Phaser.Math.Vector2(0, 18);

    this.previewGraphics.clear();
    this.previewGraphics.fillStyle(THEME.colors.panelAlt, 0.8);
    this.previewGraphics.fillRoundedRect(-186, -220, 372, 438, 30);
    this.previewGraphics.lineStyle(10, THEME.colors.moss, 0.82);
    this.previewGraphics.strokeRoundedRect(-186, -220, 372, 438, 30);

    this.previewGraphics.fillStyle(THEME.colors.gold, 0.12 + this.checkpointIndex * 0.02);
    this.previewGraphics.fillCircle(0, -170, 34);
    this.previewGraphics.fillStyle(THEME.colors.parchment, 0.5);
    this.previewGraphics.fillCircle(0, -170, 10);

    this.previewGraphics.lineStyle(14, THEME.colors.moss, 0.7);
    this.previewGraphics.beginPath();
    this.previewGraphics.moveTo(-144, -194);
    this.previewGraphics.lineTo(-144, 188);
    this.previewGraphics.moveTo(144, -194);
    this.previewGraphics.lineTo(144, 188);
    this.previewGraphics.strokePath();

    this.previewGraphics.lineStyle(18, THEME.colors.moss, 0.92);

    checkpoint.choices.forEach((choice) => {
      const endpoint = getPreviewEndpoint(choice.commandWord);
      const midY = choice.commandWord === 'SOUTH' ? 92 : (hub.y + endpoint.y) / 2;
      this.previewGraphics.beginPath();
      this.previewGraphics.moveTo(hub.x, hub.y);
      this.previewGraphics.lineTo(hub.x, midY);
      this.previewGraphics.lineTo(endpoint.x, midY);
      this.previewGraphics.lineTo(endpoint.x, endpoint.y);
      this.previewGraphics.strokePath();

      this.previewGraphics.fillStyle(THEME.colors.panel, 1);
      this.previewGraphics.fillCircle(endpoint.x, endpoint.y, 18);
      this.previewGraphics.lineStyle(6, THEME.colors.gold, 0.35);
      this.previewGraphics.strokeCircle(endpoint.x, endpoint.y, 28);
    });

    this.previewGraphics.fillStyle(THEME.colors.gold, 1);
    this.previewGraphics.fillCircle(hub.x, hub.y, 22);

    this.previewLabels.forEach((label) => label.destroy());
    this.previewLabels = [];

    const header = this.add
      .text(0, -196, `Marker ${this.checkpointIndex + 1} of ${this.checkpoints.length}`, {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    this.leftContent.add(header);
    this.previewLabels.push(header);

    checkpoint.choices.forEach((choice) => {
      const endpoint = getPreviewEndpoint(choice.commandWord);
      const text = this.add
        .text(endpoint.x, endpoint.y + (endpoint.y < hub.y ? -46 : 42), `${choice.routeSigil.icon} ${choice.label}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '18px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 124 }
        })
        .setOrigin(0.5);
      this.leftContent.add(text);
      this.previewLabels.push(text);
    });

    const footer = this.add
      .text(0, 196, 'Decode the marker to learn which branch actually stays open.', {
        fontFamily: THEME.fonts.body,
        fontSize: '17px',
        color: THEME.css.mist,
        align: 'center',
        wordWrap: { width: 300 },
        lineSpacing: 4
      })
      .setOrigin(0.5);
    this.leftContent.add(footer);
    this.previewLabels.push(footer);
  }

  private renderChoices(choices: MazeChoice[]): void {
    this.choiceButtons.forEach((entry) => entry.button.destroy());
    this.choiceButtons = [];

    choices.forEach((choice) => {
      const layout = getChoiceButtonPosition(choice.commandWord);
      const button = createTextButton(
        this,
        layout.x,
        layout.y,
        layout.width,
        layout.height,
        getChoiceDisplayLabel(choice),
        () => this.resolveChoice(choice),
        {
          fontSize: '18px'
        }
      );
      this.rightContent.add(button);
      this.choiceButtons.push({ button, choice });
    });
  }

  private resolveChoice(choice: MazeChoice): void {
    if (this.interactionLocked || !this.decodeConfirmed) {
      return;
    }

    if (choice.isCorrect) {
      this.interactionLocked = true;
      this.setChoicesEnabled(false);

      if (this.currentCheckpoint) {
        runState.recordCheckpointClear(
          this.currentCheckpoint.id,
          this.currentCheckpoint.title,
          this.checkpointIndex + 1
        );
      }

      this.setFeedbackState(
        'success',
        this.checkpointIndex === 0
          ? `${choice.feedbackText} The maze now expects this full rhythm at every marker: decode, confirm, then commit.`
          : choice.feedbackText
      );
      this.cameras.main.flash(150, 212, 177, 90, false);
      this.tweens.add({
        targets: [this.feedbackPanel, this.feedbackText],
        scaleX: 1.015,
        scaleY: 1.015,
        yoyo: true,
        duration: 180
      });

      if (this.checkpointIndex === this.checkpoints.length - 1) {
        runState.completeRun();
        this.time.delayedCall(520, () => {
          fadeToScene(this, SCENE_KEYS.RESULTS);
        });
        return;
      }

      this.time.delayedCall(480, () => {
        this.showCheckpoint(this.checkpointIndex + 1);
      });
      return;
    }

    const penaltyMs = choice.penaltyMs ?? 5000;
    this.interactionLocked = true;
    this.setChoicesEnabled(false);
    runState.recordWrongTurn();
    runState.addPenalty(penaltyMs);
    this.setFeedbackState('danger', `${choice.feedbackText} Penalty applied: ${formatPenalty(penaltyMs)}.`);
    this.cameras.main.shake(130, 0.0025);
    this.tweens.add({
      targets: [this.rightPanel, this.feedbackPanel],
      alpha: 0.88,
      yoyo: true,
      duration: 120
    });
    this.time.delayedCall(360, () => {
      this.interactionLocked = false;
      this.setChoicesEnabled(true);
    });
  }

  private setFeedbackState(
    tone: 'neutral' | 'success' | 'danger',
    message: string
  ): void {
    const config =
      tone === 'success'
        ? { fill: THEME.colors.moss, fillAlpha: 0.28, strokeAlpha: 0.58, textColor: THEME.css.parchment }
        : tone === 'danger'
          ? { fill: THEME.colors.danger, fillAlpha: 0.18, strokeAlpha: 0.38, textColor: THEME.css.danger }
          : { fill: THEME.colors.panel, fillAlpha: 0.92, strokeAlpha: 0.3, textColor: THEME.css.parchment };

    this.feedbackPanel.setFillStyle(config.fill, config.fillAlpha);
    this.feedbackPanel.setStrokeStyle(2, THEME.colors.gold, config.strokeAlpha);
    this.feedbackText.setText(message).setColor(config.textColor);
  }

  private setChoicesEnabled(enabled: boolean): void {
    this.choiceButtons.forEach((entry) => entry.button.setEnabled(enabled));
  }

  private getDecoderHelpText(): string {
    const keyWord = runState.getSnapshot().keyWord ?? '';

    if (this.checkpointIndex === 0) {
      return `Place ${keyWord.slice(0, 4)} beneath the first clue. Each number is how far to move backward because A = 0. Fill the row, press Confirm Decode, then choose the branch on that side.`;
    }

    if (this.checkpointIndex === 1) {
      return `Repeat ${keyWord} beneath the clue. Move backward by each shown amount, confirm the translated word, then commit to the matching branch.`;
    }

    return `Repeat ${keyWord} beneath the clue. Move backward by each shown amount, confirm the decoded command, then take the branch on that side of the chamber.`;
  }

  private getNeutralFeedbackText(checkpoint: MazeCheckpoint): string {
    if (this.checkpointIndex === 0) {
      return 'Tutorial marker: decode the short word, confirm it, then take the matching branch.';
    }

    return `Decode the command hidden inside ${checkpoint.ciphertext}, confirm it, then commit to the matching branch.`;
  }
}
