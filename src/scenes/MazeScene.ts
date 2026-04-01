import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatDuration, formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import {
  buildMazeRunCheckpoints,
  getMazeDifficultyLabel,
  type MazeCheckpoint,
  type MazeChoice
} from '../data/mazeCheckpoints';
import { getKeyStream, getShiftFromKeyLetter } from '../puzzles/mazeCipher';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import {
  createButton,
  createButtonRow,
  createPanel,
  createStatStrip,
  createTutorialBox,
  el
} from '../ui/domUi';
import { fitIntoBox, getWorldFrame } from '../ui/layout';
import { overlayController, type OverlayViewHandle } from '../ui/overlay';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

type FeedbackTone = 'neutral' | 'success' | 'danger';

const PREVIEW_BASE = { width: 430, height: 520 };

const getPreviewEndpoint = (commandWord: string): Phaser.Math.Vector2 => {
  switch (commandWord) {
    case 'LEFT':
    case 'WEST':
      return new Phaser.Math.Vector2(-132, 48);
    case 'RIGHT':
    case 'EAST':
      return new Phaser.Math.Vector2(132, 48);
    case 'SOUTH':
      return new Phaser.Math.Vector2(0, 148);
    case 'FORWARD':
    case 'NORTH':
    default:
      return new Phaser.Math.Vector2(0, -108);
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

export class MazeScene extends Phaser.Scene {
  private overlay?: OverlayViewHandle;
  private checkpoints: MazeCheckpoint[] = [];
  private checkpointIndex = 0;
  private currentCheckpoint: MazeCheckpoint | null = null;
  private worldFrame?: Phaser.GameObjects.Rectangle;
  private previewContainer?: Phaser.GameObjects.Container;
  private previewGraphics?: Phaser.GameObjects.Graphics;
  private previewLabels: Phaser.GameObjects.Text[] = [];
  private decodedGuess: string[] = [];
  private inputRefs: HTMLInputElement[] = [];
  private choiceButtons = new Map<string, HTMLButtonElement>();
  private decoderGrid?: HTMLDivElement;
  private titleRef?: HTMLHeadingElement;
  private subtitleRef?: HTMLParagraphElement;
  private badgeRef?: HTMLParagraphElement;
  private clueRef?: HTMLDivElement;
  private helpRef?: HTMLParagraphElement;
  private workingRef?: HTMLParagraphElement;
  private routePromptRef?: HTMLParagraphElement;
  private feedbackPanel?: HTMLElement;
  private feedbackText?: HTMLParagraphElement;
  private confirmDecodeButton?: HTMLButtonElement;
  private routeGrid?: HTMLDivElement;
  private timerValue?: HTMLDivElement;
  private keyValue?: HTMLDivElement;
  private progressValue?: HTMLDivElement;
  private penaltyValue?: HTMLDivElement;
  private wrongValue?: HTMLDivElement;
  private interactionLocked = false;
  private decodeConfirmed = false;
  private feedbackTone: FeedbackTone = 'neutral';
  private feedbackMessage = '';

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

    if (!runState.hasUnlockedKey()) {
      this.createLockedOverlay();
      this.drawLockedWorld();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.overlay?.destroy();
        this.overlay = undefined;
      });
      return;
    }

    this.checkpoints = buildMazeRunCheckpoints();
    this.createWorld();
    this.createOverlay();
    this.layoutScene();
    this.showCheckpoint(0);

    const resizeHandler = () => this.layoutScene();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
      this.overlay?.destroy();
      this.overlay = undefined;
    });
  }

  update(): void {
    this.refreshHud();
  }

  private createWorld(): void {
    this.worldFrame = this.add
      .rectangle(0, 0, PREVIEW_BASE.width, PREVIEW_BASE.height, THEME.colors.panel, 0.22)
      .setStrokeStyle(2, THEME.colors.gold, 0.22);

    this.previewGraphics = this.add.graphics();
    this.previewContainer = this.add.container(0, 0, [this.previewGraphics]);
  }

  private createOverlay(): void {
    this.overlay = overlayController.show(this.scene.key, {
      layout: 'sidebar',
      sceneClass: 'scene-maze'
    });

    const stats = createStatStrip([
      { key: 'timer', label: 'Timer', value: '00:00.0', accent: 'gold' },
      { key: 'key', label: 'Key', value: runState.getSnapshot().keyWord ?? 'Locked', accent: 'success' },
      { key: 'progress', label: 'Marker', value: '0/0' },
      { key: 'penalty', label: 'Penalty', value: '+00:00.0' },
      { key: 'wrong', label: 'Wrong Turns', value: '0', accent: 'danger' }
    ]);

    this.timerValue = stats.values.timer;
    this.keyValue = stats.values.key;
    this.progressValue = stats.values.progress;
    this.penaltyValue = stats.values.penalty;
    this.wrongValue = stats.values.wrong;
    this.overlay.top.append(stats.root);

    this.titleRef = el('h2', 'ui-panel__title');
    this.subtitleRef = el('p', 'ui-panel__description');
    this.badgeRef = el('p', 'ui-note');
    this.clueRef = el('div', 'key-display__value');
    this.helpRef = el('p', 'ui-panel__description');
    this.workingRef = el('p', 'ui-panel__description');
    this.routePromptRef = el('p', 'ui-note');
    this.decoderGrid = el('div', 'decoder-grid');
    this.routeGrid = el('div', 'route-grid');

    this.confirmDecodeButton = createButton({
      label: 'Confirm Decode',
      onClick: () => this.confirmDecode()
    });

    const sidePanel = createPanel(
      { className: 'maze-sidebar', eyebrow: 'Phase 2: Maze Run' },
      this.titleRef,
      this.subtitleRef,
      this.badgeRef,
      createPanel({ title: 'Ciphertext' }, this.clueRef),
      createTutorialBox(
        'Decoder Method',
        'Repeat the keyword beneath the clue, move backward by each shown amount, then confirm the command before choosing a route plaque.'
      ),
      this.helpRef,
      this.decoderGrid,
      createButtonRow(this.confirmDecodeButton),
      this.workingRef,
      this.routePromptRef,
      this.routeGrid
    );

    this.feedbackPanel = createPanel({ className: 'feedback-panel' });
    this.feedbackText = el('p', 'feedback-text');
    this.feedbackPanel.append(this.feedbackText);

    this.overlay.side.append(sidePanel);
    this.overlay.footer.append(this.feedbackPanel);
  }

  private createLockedOverlay(): void {
    this.overlay = overlayController.show(this.scene.key, {
      layout: 'center',
      sceneClass: 'scene-maze-locked'
    });

    const panel = createPanel(
      {
        eyebrow: 'Maze Seal',
        title: 'The hedge markers remain sealed.',
        description:
          'You have not earned the cipher key yet. Return to the egg chamber, solve the rune sequence, and bring the key into the maze before the markers can be read.'
      },
      createButtonRow(
        createButton({
          label: 'Return to the Egg',
          onClick: () => fadeToScene(this, SCENE_KEYS.MINI_PUZZLE)
        })
      )
    );

    this.overlay.main.append(panel);
  }

  private drawLockedWorld(): void {
    const panel = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width * 0.42, this.scale.height * 0.42, THEME.colors.panel, 0.18)
      .setStrokeStyle(2, THEME.colors.gold, 0.18);

    const redraw = () => {
      panel.setPosition(this.scale.width / 2, this.scale.height / 2).setSize(this.scale.width * 0.42, this.scale.height * 0.42);
    };

    const resizeHandler = () => redraw();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  private layoutScene(): void {
    if (!this.worldFrame || !this.previewContainer) {
      return;
    }

    const metrics = getWorldFrame(this, { reserveSidebar: true });
    const frameWidth = Math.min(metrics.contentWidth, 760);
    const frameHeight = Math.min(metrics.contentHeight, 760);
    const scale = fitIntoBox(PREVIEW_BASE.width, PREVIEW_BASE.height, frameWidth - 32, frameHeight - 32, 1.16);

    this.worldFrame.setPosition(metrics.centerX, metrics.centerY).setSize(frameWidth, frameHeight);
    this.previewContainer.setPosition(metrics.centerX, metrics.centerY + 8).setScale(scale);
  }

  private refreshHud(): void {
    const snapshot = runState.getSnapshot();

    this.timerValue && (this.timerValue.textContent = formatDuration(snapshot.elapsedMs));
    this.keyValue && (this.keyValue.textContent = snapshot.keyWord ?? 'Locked');
    this.progressValue && (this.progressValue.textContent = `${snapshot.currentCheckpoint}/${snapshot.totalCheckpoints}`);
    this.penaltyValue && (this.penaltyValue.textContent = formatPenalty(snapshot.penaltyMs));
    this.wrongValue && (this.wrongValue.textContent = `${snapshot.wrongTurns}`);
  }

  private showCheckpoint(index: number): void {
    const checkpoint = this.checkpoints[index];
    this.currentCheckpoint = checkpoint;
    this.checkpointIndex = index;
    this.interactionLocked = false;
    this.decodeConfirmed = false;
    this.decodedGuess = Array.from({ length: checkpoint.ciphertext.length }, () => '?');
    this.feedbackTone = 'neutral';
    this.feedbackMessage = this.getNeutralFeedbackText(checkpoint);
    runState.setCheckpointProgress(index + 1, this.checkpoints.length);

    this.renderMazePreview();
    this.renderDecoderInputs();
    this.renderRouteChoices(checkpoint.choices);
    this.refreshOverlay();
  }

  private refreshOverlay(): void {
    const checkpoint = this.currentCheckpoint;

    this.refreshHud();

    if (!checkpoint) {
      return;
    }

    if (this.titleRef) {
      this.titleRef.textContent = checkpoint.title;
    }

    if (this.subtitleRef) {
      this.subtitleRef.textContent = checkpoint.flavorText;
    }

    if (this.badgeRef) {
      this.badgeRef.textContent =
        this.checkpointIndex === 0
          ? `Tutorial marker | Key ${runState.getSnapshot().keyWord}`
          : `${getMazeDifficultyLabel(checkpoint.difficulty)} | Key ${runState.getSnapshot().keyWord}`;
    }

    if (this.clueRef) {
      this.clueRef.textContent = checkpoint.ciphertext;
    }

    if (this.helpRef) {
      this.helpRef.textContent = this.getDecoderHelpText();
    }

    if (this.workingRef) {
      this.workingRef.textContent = this.getWorkingText();
    }

    if (this.routePromptRef) {
      this.routePromptRef.textContent = this.getRoutePromptText();
    }

    if (this.feedbackPanel && this.feedbackText) {
      this.feedbackPanel.className = `ui-panel feedback-panel${
        this.feedbackTone !== 'neutral' ? ` ui-panel--${this.feedbackTone}` : ''
      }`;
      this.feedbackText.textContent = this.feedbackMessage;
    }

    const workingDecode = this.decodedGuess.join('');
    const complete = !workingDecode.includes('?');

    if (this.confirmDecodeButton) {
      this.confirmDecodeButton.disabled = !complete || this.decodeConfirmed || this.interactionLocked;
      this.confirmDecodeButton.textContent = this.decodeConfirmed ? 'Decoded' : 'Confirm Decode';
    }

    this.inputRefs.forEach((input, index) => {
      input.value = this.decodedGuess[index] === '?' ? '' : this.decodedGuess[index];
      input.disabled = this.decodeConfirmed || this.interactionLocked;
    });

    this.choiceButtons.forEach((button, id) => {
      const choice = checkpoint.choices.find((entry) => entry.id === id);
      button.disabled = !choice || !this.decodeConfirmed || this.interactionLocked;
    });
  }

  private renderDecoderInputs(): void {
    if (!this.decoderGrid || !this.currentCheckpoint) {
      return;
    }

    const decoderGrid = this.decoderGrid;
    const checkpoint = this.currentCheckpoint;
    const keyStream = getKeyStream(checkpoint.ciphertext, runState.getSnapshot().keyWord ?? '');
    this.inputRefs = [];
    decoderGrid.replaceChildren();
    decoderGrid.style.setProperty('--decoder-columns', `${checkpoint.ciphertext.length}`);

    const rows: Array<{ label: string; values: string[]; variant?: 'cipher' | 'shift' | 'guess' }> = [
      { label: this.checkpointIndex === 0 ? '1 Cipher' : 'Cipher', values: checkpoint.ciphertext.split(''), variant: 'cipher' },
      { label: this.checkpointIndex === 0 ? '2 Key' : 'Key', values: keyStream.split('') },
      {
        label: this.checkpointIndex === 0 ? '3 Back' : 'Back',
        values: keyStream.split('').map((character) => `${getShiftFromKeyLetter(character)}`),
        variant: 'shift'
      }
    ];

    rows.forEach((row) => {
      decoderGrid.append(el('div', 'decoder-label', row.label));
      row.values.forEach((value) => {
        decoderGrid.append(
          el(
            'div',
            `decoder-cell${row.variant === 'cipher' ? ' decoder-cell--cipher' : ''}${
              row.variant === 'shift' ? ' decoder-cell--shift' : ''
            }`,
            value
          )
        );
      });
    });

    decoderGrid.append(el('div', 'decoder-label', this.checkpointIndex === 0 ? '4 Guess' : 'Guess'));

    checkpoint.ciphertext.split('').forEach((_, index) => {
      const input = el('input', 'decoder-input') as HTMLInputElement;
      input.type = 'text';
      input.inputMode = 'text';
      input.maxLength = 1;
      input.setAttribute('aria-label', `Decoded letter ${index + 1}`);
      input.addEventListener('input', () => this.handleInputChange(index, input.value));
      input.addEventListener('keydown', (event) => this.handleInputKeydown(event, index));
      this.inputRefs.push(input);
      decoderGrid.append(input);
    });
  }

  private handleInputChange(index: number, value: string): void {
    if (this.decodeConfirmed || this.interactionLocked) {
      return;
    }

    const nextValue = value.replace(/[^a-z]/gi, '').toUpperCase().slice(-1);
    this.decodedGuess[index] = nextValue || '?';

    if (nextValue && index < this.inputRefs.length - 1) {
      this.inputRefs[index + 1].focus();
      this.inputRefs[index + 1].select();
    }

    this.refreshOverlay();
  }

  private handleInputKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.inputRefs[index - 1].focus();
      this.inputRefs[index - 1].select();
      return;
    }

    if (event.key === 'ArrowRight' && index < this.inputRefs.length - 1) {
      event.preventDefault();
      this.inputRefs[index + 1].focus();
      this.inputRefs[index + 1].select();
      return;
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && !this.inputRefs[index].value && index > 0) {
      this.decodedGuess[index] = '?';
      this.inputRefs[index - 1].focus();
      this.inputRefs[index - 1].select();
      this.refreshOverlay();
    }
  }

  private renderRouteChoices(choices: MazeChoice[]): void {
    if (!this.routeGrid) {
      return;
    }

    this.choiceButtons.clear();
    this.routeGrid.replaceChildren();

    choices.forEach((choice) => {
      const button = createButton({
        label: '',
        tone: 'secondary',
        disabled: true,
        className: 'route-choice',
        onClick: () => this.resolveChoice(choice)
      });

      button.dataset.command = choice.commandWord;
      button.replaceChildren(
        el('span', 'route-choice__sigil', `${choice.routeSigil.icon} ${choice.routeSigil.title}`),
        el('span', 'route-choice__label', choice.label)
      );

      this.routeButtonsSet(choice.id, button);
      this.routeGrid?.append(button);
    });
  }

  private routeButtonsSet(choiceId: string, button: HTMLButtonElement): void {
    this.choiceButtons.set(choiceId, button);
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
      this.feedbackTone = 'danger';
      this.feedbackMessage = `The marker rejects "${workingDecode}". Penalty applied: ${formatPenalty(penaltyMs)}.`;
      this.cameras.main.shake(110, 0.0018);
      this.refreshOverlay();
      return;
    }

    this.decodeConfirmed = true;
    this.feedbackTone = 'success';
    this.feedbackMessage = `Decoded command confirmed: ${workingDecode}. Choose the route plaque on the ${getBranchPrompt(workingDecode)}.`;
    this.tweens.add({
      targets: this.worldFrame,
      alpha: 0.88,
      yoyo: true,
      duration: 160
    });
    this.refreshOverlay();
  }

  private renderMazePreview(): void {
    if (!this.previewGraphics || !this.previewContainer || !this.currentCheckpoint) {
      return;
    }

    const previewGraphics = this.previewGraphics;
    const previewContainer = this.previewContainer;
    const checkpoint = this.currentCheckpoint;
    const hub = new Phaser.Math.Vector2(0, 18);

    previewGraphics.clear();
    previewGraphics.fillStyle(THEME.colors.panelAlt, 0.8);
    previewGraphics.fillRoundedRect(-186, -220, 372, 438, 30);
    previewGraphics.lineStyle(10, THEME.colors.moss, 0.82);
    previewGraphics.strokeRoundedRect(-186, -220, 372, 438, 30);

    previewGraphics.fillStyle(THEME.colors.gold, 0.12 + this.checkpointIndex * 0.02);
    previewGraphics.fillCircle(0, -170, 34);
    previewGraphics.fillStyle(THEME.colors.parchment, 0.5);
    previewGraphics.fillCircle(0, -170, 10);

    previewGraphics.lineStyle(14, THEME.colors.moss, 0.7);
    previewGraphics.beginPath();
    previewGraphics.moveTo(-144, -194);
    previewGraphics.lineTo(-144, 188);
    previewGraphics.moveTo(144, -194);
    previewGraphics.lineTo(144, 188);
    previewGraphics.strokePath();

    previewGraphics.lineStyle(18, THEME.colors.moss, 0.92);

    checkpoint.choices.forEach((choice) => {
      const endpoint = getPreviewEndpoint(choice.commandWord);
      const midY = choice.commandWord === 'SOUTH' ? 92 : (hub.y + endpoint.y) / 2;
      previewGraphics.beginPath();
      previewGraphics.moveTo(hub.x, hub.y);
      previewGraphics.lineTo(hub.x, midY);
      previewGraphics.lineTo(endpoint.x, midY);
      previewGraphics.lineTo(endpoint.x, endpoint.y);
      previewGraphics.strokePath();

      previewGraphics.fillStyle(THEME.colors.panel, 1);
      previewGraphics.fillCircle(endpoint.x, endpoint.y, 18);
      previewGraphics.lineStyle(6, THEME.colors.gold, 0.35);
      previewGraphics.strokeCircle(endpoint.x, endpoint.y, 28);
    });

    previewGraphics.fillStyle(THEME.colors.gold, 1);
    previewGraphics.fillCircle(hub.x, hub.y, 22);

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
    previewContainer.add(header);
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
      previewContainer.add(text);
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
    previewContainer.add(footer);
    this.previewLabels.push(footer);
  }

  private resolveChoice(choice: MazeChoice): void {
    if (this.interactionLocked || !this.decodeConfirmed) {
      return;
    }

    if (choice.isCorrect) {
      this.interactionLocked = true;

      if (this.currentCheckpoint) {
        runState.recordCheckpointClear(
          this.currentCheckpoint.id,
          this.currentCheckpoint.title,
          this.checkpointIndex + 1
        );
      }

      this.feedbackTone = 'success';
      this.feedbackMessage =
        this.checkpointIndex === 0
          ? `${choice.feedbackText} The maze now expects this rhythm at every marker: decode, confirm, then commit.`
          : choice.feedbackText;
      this.cameras.main.flash(150, 212, 177, 90, false);
      this.refreshOverlay();

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
    runState.recordWrongTurn();
    runState.addPenalty(penaltyMs);
    this.feedbackTone = 'danger';
    this.feedbackMessage = `${choice.feedbackText} Penalty applied: ${formatPenalty(penaltyMs)}.`;
    this.cameras.main.shake(130, 0.0025);
    this.refreshOverlay();
    this.time.delayedCall(360, () => {
      this.interactionLocked = false;
      this.refreshOverlay();
    });
  }

  private getWorkingText(): string {
    const checkpoint = this.currentCheckpoint;
    if (!checkpoint) {
      return '';
    }

    const workingDecode = this.decodedGuess.join('');
    const complete = !workingDecode.includes('?');

    if (this.decodeConfirmed) {
      return `Decoded command: ${checkpoint.decodedCommand}. Choose the route plaque on the ${getBranchPrompt(checkpoint.decodedCommand)}.`;
    }

    if (!complete && this.checkpointIndex === 0) {
      return `Working decode: ${workingDecode}. Fill every cell, then confirm the word before the plaques unlock.`;
    }

    if (!complete) {
      return `Working decode: ${workingDecode}. Fill every column, then press Confirm Decode to test the translation.`;
    }

    if (workingDecode === checkpoint.decodedCommand) {
      return `Working decode: ${workingDecode}. That looks correct. Press Confirm Decode to unseal the route plaques.`;
    }

    return `Working decode: ${workingDecode}. Press Confirm Decode to test it. Wrong translations cost time.`;
  }

  private getRoutePromptText(): string {
    if (this.decodeConfirmed) {
      return 'The marker is open. Wrong branches still waste time.';
    }

    if (this.decodedGuess.join('').includes('?')) {
      return 'Route plaques stay sealed until the marker accepts a full decode.';
    }

    return 'A complete guess is not enough by itself. The marker must accept it first.';
  }

  private getDecoderHelpText(): string {
    const keyWord = runState.getSnapshot().keyWord ?? '';

    if (this.checkpointIndex === 0) {
      return `Place ${keyWord.slice(0, 4)} beneath the first clue. Each number is how far to move backward because A = 0.`;
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
