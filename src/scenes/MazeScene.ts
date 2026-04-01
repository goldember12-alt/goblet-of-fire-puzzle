import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import {
  getMazeDifficultyLabel,
  mazeCheckpoints,
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

const LEFT_PANEL_BASE = { width: 460, height: 620 };
const RIGHT_PANEL_BASE = { width: 700, height: 620 };

const getCommandMarker = (commandWord: string): string => {
  switch (commandWord) {
    case 'LEFT':
    case 'WEST':
      return '<';
    case 'RIGHT':
    case 'EAST':
      return '>';
    case 'FORWARD':
    case 'NORTH':
      return '^';
    case 'SOUTH':
      return 'v';
    default:
      return '?';
  }
};

const getChoiceDisplayLabel = (choice: MazeChoice, index: number): string =>
  `Path ${String.fromCharCode(65 + index)}  [${getCommandMarker(choice.commandWord)}]\n${choice.label}`;

export class MazeScene extends Phaser.Scene {
  private hud!: RunHud;
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
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private previewLabels: Phaser.GameObjects.Text[] = [];
  private choiceButtons: TextButton[] = [];
  private decoderColumns: DecoderColumnView[] = [];
  private decoderLabels: Phaser.GameObjects.Text[] = [];
  private decodedGuess: string[] = [];
  private selectedDecodeIndex = 0;
  private keyListener?: (event: KeyboardEvent) => void;
  private interactionLocked = false;

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
      fontSize: '48px',
      color: THEME.css.parchment
    });

    this.subtitleText = this.add.text(0, 0, '', {
      fontFamily: THEME.fonts.body,
      fontSize: '21px',
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
        fontSize: '24px',
        color: THEME.css.parchment,
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    this.leftContent = this.add.container(0, 0);
    this.rightContent = this.add.container(0, 0);

    this.previewGraphics = this.add.graphics();
    this.leftContent.add(this.previewGraphics);

    this.clueText = this.add
      .text(0, -236, '', {
        fontFamily: THEME.fonts.display,
        fontSize: '56px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    this.decoderBadgeText = this.add
      .text(0, -184, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    this.decoderHelpText = this.add
      .text(0, -136, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '19px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 560 },
        lineSpacing: 6
      })
      .setOrigin(0.5);
    this.workingDecodeText = this.add
      .text(0, 120, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.mist,
        align: 'center',
        wordWrap: { width: 560 },
        lineSpacing: 6
      })
      .setOrigin(0.5);
    this.rightContent.add([this.clueText, this.decoderBadgeText, this.decoderHelpText, this.workingDecodeText]);
  }

  private layoutScene(): void {
    const metrics = getSceneLayoutMetrics(this);
    const hudWidthReserve = Phaser.Math.Clamp(Math.round(metrics.width * 0.26), 300, 392) + metrics.gap;
    const titleWrapWidth = Math.max(340, metrics.width - metrics.padding * 2 - hudWidthReserve);

    this.titleText.setPosition(metrics.padding, metrics.padding + 12);
    this.subtitleText.setPosition(metrics.padding, metrics.padding + 58).setWordWrapWidth(titleWrapWidth);

    const rightWidthInitial = Phaser.Math.Clamp(Math.round(metrics.usableWidth * 0.58), 620, 760);
    const leftWidth = Math.max(340, metrics.usableWidth - rightWidthInitial - metrics.gap);
    const rightWidth = metrics.usableWidth - leftWidth - metrics.gap;
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
    if (!this.currentCheckpoint || !runState.hasUnlockedKey() || this.interactionLocked) {
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
        'You have not earned the cipher key yet. Return to the artifact chamber, complete the rune sequence, and bring the key into the maze before the markers can be read.',
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
    const checkpoint = mazeCheckpoints[index];
    this.currentCheckpoint = checkpoint;
    this.checkpointIndex = index;
    this.interactionLocked = false;
    this.selectedDecodeIndex = 0;
    this.decodedGuess = Array.from({ length: checkpoint.ciphertext.length }, () => '?');
    runState.setCheckpointProgress(index + 1, mazeCheckpoints.length);

    this.titleText.setText(checkpoint.title);
    this.subtitleText.setText(checkpoint.flavorText);
    this.clueText
      .setText(checkpoint.ciphertext)
      .setFontSize(checkpoint.ciphertext.length > 6 ? 52 : checkpoint.ciphertext.length > 5 ? 54 : 56);
    this.rightPanelLabel.setText(index === 0 ? 'Cipher Tutorial' : 'Cipher Marker');
    this.decoderBadgeText.setText(
      index === 0
        ? 'First marker: decode a short word, then match it to the correct path sign.'
        : `${getMazeDifficultyLabel(checkpoint.difficulty)} | Key ${runState.getSnapshot().keyWord}`
    );
    this.decoderHelpText.setText(this.getDecoderHelpText());
    this.setFeedbackState('neutral', this.getNeutralFeedbackText(checkpoint));

    this.renderMazePreview();
    this.renderDecoderAid(checkpoint);
    this.renderChoices(checkpoint.choices);
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
    const spacing = count > 6 ? 52 : count > 5 ? 56 : 62;
    const startX = ((count - 1) * spacing) / -2;
    const labelX = -264;

    const labels =
      this.checkpointIndex === 0
        ? [
            { text: '1 Cipher', y: -74 },
            { text: '2 Key', y: -32 },
            { text: '3 Shift', y: 10 },
            { text: '4 Decode', y: 62 }
          ]
        : [
            { text: 'Cipher', y: -74 },
            { text: 'Key', y: -32 },
            { text: 'Shift', y: 10 },
            { text: 'Decode', y: 62 }
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
        .text(x, -74, character, {
          fontFamily: THEME.fonts.display,
          fontSize: '30px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);
      const keyText = this.add
        .text(x, -32, keyCharacter, {
          fontFamily: THEME.fonts.display,
          fontSize: '28px',
          color: THEME.css.parchment
        })
        .setOrigin(0.5);
      const shiftText = this.add
        .text(x, 10, `-${shift}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.mist
        })
        .setOrigin(0.5);
      const guessBackground = this.add
        .rectangle(x, 62, 50, 50, THEME.colors.panelAlt, 0.96)
        .setStrokeStyle(2, THEME.colors.gold, 0.35);
      const guessText = this.add
        .text(x, 62, this.decodedGuess[index], {
          fontFamily: THEME.fonts.display,
          fontSize: '28px',
          color: THEME.css.parchment
        })
        .setOrigin(0.5);

      guessBackground.setInteractive();
      guessBackground.on('pointerdown', () => {
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

    this.refreshDecoderGuess();
  }

  private refreshDecoderGuess(): void {
    this.decoderColumns.forEach((column, index) => {
      const selected = index === this.selectedDecodeIndex;
      column.guessText.setText(this.decodedGuess[index]);
      column.guessBackground.setFillStyle(selected ? THEME.colors.moss : THEME.colors.panelAlt, 0.96);
      column.guessBackground.setStrokeStyle(2, THEME.colors.gold, selected ? 0.72 : 0.35);
    });

    const workingDecode = this.decodedGuess.join('');
    const exactMatch = this.currentCheckpoint?.choices.find((choice) => choice.commandWord === workingDecode) ?? null;
    const unresolved = workingDecode.includes('?');

    if (exactMatch) {
      this.workingDecodeText.setText(
        `Working decode: ${workingDecode}\nThe command is ready. Choose the matching path sign below.`
      );
      return;
    }

    if (this.checkpointIndex === 0 && unresolved) {
      this.workingDecodeText.setText(
        `Working decode: ${workingDecode}\nLeft and Right move between cells. Up and Down or the mouse changes the selected letter.`
      );
      return;
    }

    this.workingDecodeText.setText(
      `Working decode: ${workingDecode}\nDecode the command, then choose the path sign whose marker points the same way.`
    );
  }

  private renderMazePreview(): void {
    const total = mazeCheckpoints.length;
    const startY = -106;
    const endY = 154;
    const spacing = total === 1 ? 0 : (endY - startY) / (total - 1);
    const activeY = startY + this.checkpointIndex * spacing;

    this.previewGraphics.clear();
    this.previewGraphics.lineStyle(10, THEME.colors.moss, 0.9);
    this.previewGraphics.strokeRoundedRect(-205, -135, 410, 320, 28);
    this.previewGraphics.lineStyle(8, THEME.colors.gold, 0.5);
    this.previewGraphics.beginPath();
    this.previewGraphics.moveTo(0, startY - 18);
    this.previewGraphics.lineTo(0, endY + 18);
    this.previewGraphics.strokePath();
    this.previewGraphics.lineStyle(14, THEME.colors.gold, 0.24);
    this.previewGraphics.strokeCircle(0, activeY, 46);

    this.previewLabels.forEach((label) => label.destroy());
    this.previewLabels = [];

    for (let index = 0; index < total; index += 1) {
      const checkpoint = mazeCheckpoints[index];
      const y = startY + index * spacing;
      const isActive = index === this.checkpointIndex;
      const isCleared = index < this.checkpointIndex;

      this.previewGraphics.fillStyle(
        isActive ? THEME.colors.gold : isCleared ? THEME.colors.success : THEME.colors.panelAlt,
        1
      );
      this.previewGraphics.fillCircle(0, y, 20);

      if (index < total - 1) {
        this.previewGraphics.lineStyle(4, THEME.colors.gold, 0.22);
        this.previewGraphics.beginPath();
        this.previewGraphics.moveTo(0, y + 20);
        this.previewGraphics.lineTo(index % 2 === 0 ? 30 : -30, y + spacing / 2);
        this.previewGraphics.strokePath();
      }

      const label = this.add
        .text(62, y, `Marker ${index + 1} - ${getMazeDifficultyLabel(checkpoint.difficulty)}`, {
          fontFamily: THEME.fonts.body,
          fontSize: total > 5 ? '20px' : '24px',
          color: isActive ? THEME.css.parchment : THEME.css.mist
        })
        .setOrigin(0, 0.5);
      this.leftContent.add(label);
      this.previewLabels.push(label);
    }
  }

  private renderChoices(choices: MazeChoice[]): void {
    this.choiceButtons.forEach((button) => button.destroy());
    this.choiceButtons = [];

    choices.forEach((choice, index) => {
      const button = createTextButton(
        this,
        0,
        188 + index * 82,
        538,
        68,
        getChoiceDisplayLabel(choice, index),
        () => this.resolveChoice(choice),
        {
          fontSize: '21px'
        }
      );
      this.rightContent.add(button);
      this.choiceButtons.push(button);
    });
  }

  private resolveChoice(choice: MazeChoice): void {
    if (this.interactionLocked) {
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
          ? `${choice.feedbackText} You have the decoder rhythm now: read the word, then trust the path sign that matches it.`
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

      if (this.checkpointIndex === mazeCheckpoints.length - 1) {
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
    this.choiceButtons.forEach((button) => button.setEnabled(enabled));
  }

  private getDecoderHelpText(): string {
    if (this.checkpointIndex === 0) {
      return `Repeat ${runState.getSnapshot().keyWord} under the clue, then move backward by each shown shift.\nMatch the decoded command to the path sign marker below.`;
    }

    if (this.checkpointIndex === 1) {
      return `The second marker still favors clean fundamentals: align ${runState.getSnapshot().keyWord}, subtract each shown shift, then trust the path sign marker that matches the decoded direction.`;
    }

    return `Repeat ${runState.getSnapshot().keyWord} beneath the clue. For each column, move backward by the shown shift, then choose the path sign that points the same way.`;
  }

  private getNeutralFeedbackText(checkpoint: MazeCheckpoint): string {
    if (this.checkpointIndex === 0) {
      return 'Tutorial marker: decode the short word, then choose the path sign whose marker points the same way.';
    }

    return `Decode the command hidden inside ${checkpoint.ciphertext}, then choose the matching path sign below.`;
  }
}
