import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatDuration, formatPenalty } from '../core/time';
import { THEME } from '../core/theme';
import {
  countCorrectPlacements,
  createEmptyArrangement,
  evaluateArrangement,
  getFirstHintPlacement,
  isArrangementComplete,
  isSolvedArrangement,
  type Arrangement,
  type RuleEvaluation
} from '../puzzles/runeSequenceLogic';
import { runeSequencePuzzle, type RuneFragment } from '../puzzles/runeSequencePuzzle';
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

type FragmentButtonView = {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  hitZone: Phaser.GameObjects.Rectangle;
  fragmentId: string;
};

type SlotView = {
  background: Phaser.GameObjects.Rectangle;
  fragmentText: Phaser.GameObjects.Text;
  lockText: Phaser.GameObjects.Text;
};

type StatusTone = 'neutral' | 'success' | 'danger' | 'warning';

const WORLD_BASE = { width: 800, height: 700 };

export class MiniPuzzleScene extends Phaser.Scene {
  private readonly puzzle = runeSequencePuzzle;
  private arrangement: Arrangement = createEmptyArrangement(this.puzzle.solutionOrder.length);
  private readonly lockedSlots = new Set<number>();
  private readonly fragmentButtons = new Map<string, FragmentButtonView>();
  private readonly slotViews: SlotView[] = [];
  private overlay?: OverlayViewHandle;
  private worldFrame!: Phaser.GameObjects.Rectangle;
  private worldContainer!: Phaser.GameObjects.Container;
  private worldGlow!: Phaser.GameObjects.Ellipse;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private selectedFragmentId: string | null = null;
  private lastEvaluations: RuleEvaluation[] | null = null;
  private solved = false;
  private statusTone: StatusTone = 'neutral';
  private statusMessage = 'Arrange the runes, then test the sequence against the omen cards.';
  private statusDismissed = false;
  private timerValue?: HTMLDivElement;
  private attemptsValue?: HTMLDivElement;
  private hintsValue?: HTMLDivElement;
  private keyHudValue?: HTMLDivElement;
  private keyDisplayValue?: HTMLDivElement;
  private selectedInfo?: HTMLParagraphElement;
  private summaryInfo?: HTMLParagraphElement;
  private ruleList?: HTMLDivElement;
  private footerPanel?: HTMLElement;
  private footerText?: HTMLParagraphElement;
  private footerCloseButton?: HTMLButtonElement;
  private hintButton?: HTMLButtonElement;
  private testButton?: HTMLButtonElement;
  private resetButton?: HTMLButtonElement;
  private enterMazeButton?: HTMLButtonElement;

  constructor() {
    super(SCENE_KEYS.MINI_PUZZLE);
  }

  create(): void {
    if (!runState.getSnapshot().active) {
      runState.startRun();
    }

    runState.setPhase('mini-puzzle');
    drawSceneBackdrop(this);
    playSceneEnter(this);
    this.initializePuzzleState();
    this.createWorld();
    this.createOverlay();
    this.layoutScene();
    this.refreshView();

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

  private initializePuzzleState(): void {
    if (runState.hasUnlockedKey() && runState.getSnapshot().keyWord === this.puzzle.keyWord) {
      this.arrangement = [...this.puzzle.solutionOrder];
      this.solved = true;
      this.lastEvaluations = evaluateArrangement(this.puzzle, this.arrangement);
      this.puzzle.solutionOrder.forEach((_, index) => this.lockedSlots.add(index));
      this.statusTone = 'success';
      this.statusMessage = 'The egg is already aligned and humming with stored light.';
      return;
    }

    this.arrangement = createEmptyArrangement(this.puzzle.solutionOrder.length);
    this.lockedSlots.clear();
    this.selectedFragmentId = null;
    this.lastEvaluations = null;
    this.solved = false;
    this.statusTone = 'neutral';
    this.statusMessage = 'Arrange the runes, then test the sequence against the omen cards.';
  }

  private createWorld(): void {
    this.worldFrame = this.add
      .rectangle(0, 0, WORLD_BASE.width, WORLD_BASE.height, THEME.colors.panel, 0.24)
      .setStrokeStyle(2, THEME.colors.gold, 0.22);

    this.worldContainer = this.add.container(0, 0);

    this.titleText = this.add
      .text(0, -302, this.puzzle.artifactName, {
        fontFamily: THEME.fonts.display,
        fontSize: '40px',
        color: THEME.css.gold
      })
      .setOrigin(0.5);

    this.instructionText = this.add
      .text(0, -228, 'Select a rune fragment, then place it on a pedestal below the egg.', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.mist,
        align: 'center',
        wordWrap: { width: 560 },
        lineSpacing: 5
      })
      .setOrigin(0.5);

    this.worldGlow = this.add
      .ellipse(0, -40, 228, 250, THEME.colors.gold, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    const outerEgg = this.add
      .ellipse(0, -8, 302, 326, THEME.colors.panelAlt, 0.96)
      .setStrokeStyle(4, THEME.colors.gold, 0.4);
    const innerEgg = this.add
      .ellipse(0, -8, 228, 252, THEME.colors.midnight, 0.94)
      .setStrokeStyle(2, THEME.colors.gold, 0.22);
    const lowerGlyph = this.add
      .ellipse(0, 44, 108, 126, THEME.colors.parchment, 0.08)
      .setStrokeStyle(2, THEME.colors.gold, 0.18);

    this.worldContainer.add([this.titleText, this.instructionText, this.worldGlow, outerEgg, innerEgg, lowerGlyph]);

    const positions = Phaser.Utils.Array.Shuffle([
      { x: -196, y: -112 },
      { x: 196, y: -112 },
      { x: -284, y: 42 },
      { x: 284, y: 42 },
      { x: 0, y: 206 }
    ]);

    this.puzzle.fragments.forEach((fragment, index) => {
      const position = positions[index];
      const background = this.add
        .rectangle(0, 0, 146, 94, THEME.colors.panelAlt, 0.98)
        .setStrokeStyle(2, THEME.colors.gold, 0.35);
      const iconDisk = this.add
        .circle(0, -22, 20, THEME.colors.moss, 1)
        .setStrokeStyle(2, THEME.colors.gold, 0.42);
      const iconGlyph = this.createRuneGlyph(fragment, 0, -22);
      const labelText = this.add
        .text(0, 12, fragment.label.replace(' Rune', ''), {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 114 }
        })
        .setOrigin(0.5);
      const sigilText = this.add
        .text(0, 36, fragment.sigil, {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);
      const hitZone = this.add.rectangle(0, 0, 146, 94, 0xffffff, 0.001);
      const container = this.add.container(position.x, position.y, [
        background,
        iconDisk,
        iconGlyph,
        labelText,
        sigilText,
        hitZone
      ]);

      container.setSize(146, 94);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => this.selectFragment(fragment.id));
      this.worldContainer.add(container);

      this.fragmentButtons.set(fragment.id, {
        container,
        background,
        hitZone,
        fragmentId: fragment.id
      });
    });

    const startX = -248;

    for (let index = 0; index < this.puzzle.solutionOrder.length; index += 1) {
      const x = startX + index * 124;
      const pedestalLabel = this.add
        .text(x, 266, `Ped. ${index + 1}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.css.mist
        })
        .setOrigin(0.5);
      const background = this.add
        .rectangle(x, 320, 98, 76, THEME.colors.panel, 0.94)
        .setStrokeStyle(2, THEME.colors.gold, 0.28);
      const fragmentText = this.add
        .text(x, 312, '---', {
          fontFamily: THEME.fonts.display,
          fontSize: '26px',
          color: THEME.css.parchment,
          align: 'center'
        })
        .setOrigin(0.5);
      const lockText = this.add
        .text(x, 342, '', {
          fontFamily: THEME.fonts.body,
          fontSize: '14px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);

      background.setInteractive({ useHandCursor: true });
      background.on('pointerdown', () => this.handleSlotClick(index));
      this.worldContainer.add([pedestalLabel, background, fragmentText, lockText]);

      this.slotViews.push({
        background,
        fragmentText,
        lockText
      });
    }
  }

  private createOverlay(): void {
    this.overlay = overlayController.show(this.scene.key, {
      layout: 'sidebar',
      sceneClass: 'scene-mini'
    });

    const stats = createStatStrip([
      { key: 'timer', label: 'Timer', value: '00:00.0', accent: 'gold' },
      { key: 'attempts', label: 'Attempts', value: '0' },
      { key: 'hints', label: 'Hints', value: '0' },
      { key: 'key', label: 'Key', value: 'Locked', accent: 'success' }
    ]);

    this.timerValue = stats.values.timer;
    this.attemptsValue = stats.values.attempts;
    this.hintsValue = stats.values.hints;
    this.keyHudValue = stats.values.key;
    this.overlay.top.append(stats.root);

    this.selectedInfo = el('p', 'ui-panel__description');
    this.summaryInfo = el('p', 'ui-panel__description');
    this.ruleList = el('div', 'rule-list');

    const keyLabel = el('div', 'key-display__label', 'Cipher Key');
    this.keyDisplayValue = el('div', 'key-display__value', 'Locked');
    const keyDisplay = el('div', 'key-display');
    keyDisplay.append(keyLabel, this.keyDisplayValue);

    this.hintButton = createButton({
      label: 'Take Hint',
      tone: 'secondary',
      onClick: () => this.applyHint()
    });

    this.resetButton = createButton({
      label: 'Clear Slots',
      tone: 'ghost',
      onClick: () => this.resetBoard()
    });

    this.testButton = createButton({
      label: 'Test Sequence',
      onClick: () => this.testSequence()
    });

    this.enterMazeButton = createButton({
      label: 'Enter the Maze',
      disabled: true,
      onClick: () => fadeToScene(this, SCENE_KEYS.MAZE)
    });

    const focusPanel = createPanel(
      { className: 'mini-focus-panel', title: 'Current Focus' },
      this.selectedInfo,
      this.summaryInfo
    );

    const omenPanel = createPanel(
      {
        className: 'mini-omen-panel',
        title: 'Omen Cards',
        description: 'These rule cards are the logic clues for the egg. Their states update after each test.'
      },
      this.ruleList
    );

    const utilityRow = createButtonRow(this.hintButton, this.resetButton);
    utilityRow.classList.add('mini-actions');

    const primaryRow = createButtonRow(this.testButton, this.enterMazeButton);
    primaryRow.classList.add('mini-actions');

    const sidePanel = createPanel(
      {
        className: 'mini-sidebar',
        eyebrow: 'Phase 1: Key Unlock',
        title: this.puzzle.title,
        description: this.puzzle.objective
      },
      createTutorialBox('Artifact Controls', this.puzzle.interactionHint),
      keyDisplay,
      focusPanel,
      omenPanel,
      utilityRow,
      primaryRow
    );

    this.footerPanel = createPanel({ className: 'status-panel' });
    this.footerCloseButton = el('button', 'status-panel__close', 'x') as HTMLButtonElement;
    this.footerCloseButton.type = 'button';
    this.footerCloseButton.setAttribute('aria-label', 'Close status message');
    this.footerCloseButton.addEventListener('click', () => {
      this.statusDismissed = true;
      this.refreshOverlay();
    });
    this.footerText = el('p', 'status-text');
    this.footerPanel.append(this.footerCloseButton, this.footerText);

    this.overlay.side.append(sidePanel);
    this.overlay.footer.append(this.footerPanel);
  }

  private layoutScene(): void {
    const metrics = getWorldFrame(this, { reserveSidebar: true });
    const topHudReserve = 104;
    const bottomReserve = 20;
    const availableHeight = Math.max(520, metrics.contentHeight - topHudReserve - bottomReserve);
    const frameWidth = Math.min(metrics.contentWidth, 900);
    const frameHeight = Math.min(availableHeight, 780);
    const worldScale = fitIntoBox(
      WORLD_BASE.width,
      WORLD_BASE.height,
      frameWidth - 36,
      frameHeight - 36,
      1.12
    );

    const frameTop = metrics.contentTop + topHudReserve;
    const frameCenterY = frameTop + frameHeight / 2;

    this.worldFrame.setPosition(metrics.centerX, frameCenterY).setSize(frameWidth, frameHeight);
    this.worldContainer.setPosition(metrics.centerX, frameCenterY + 12).setScale(worldScale);
  }

  private refreshHud(): void {
    const snapshot = runState.getSnapshot();

    if (this.timerValue) {
      this.timerValue.textContent = formatDuration(snapshot.elapsedMs);
    }

    if (this.attemptsValue) {
      this.attemptsValue.textContent = `${snapshot.miniPuzzleAttempts}`;
    }

    if (this.hintsValue) {
      this.hintsValue.textContent = `${snapshot.hintsUsed}`;
    }

    const keyLabel = snapshot.keyWord ?? 'Locked';
    this.keyHudValue && (this.keyHudValue.textContent = keyLabel);
  }

  private refreshOverlay(): void {
    const snapshot = runState.getSnapshot();

    this.refreshHud();

    if (this.keyDisplayValue) {
      this.keyDisplayValue.textContent = this.solved ? this.puzzle.keyWord : 'Locked';
    }

    if (this.selectedInfo) {
      const selectedName = this.selectedFragmentId
        ? this.puzzle.fragments.find((fragment) => fragment.id === this.selectedFragmentId)?.label ?? 'Unknown Rune'
        : 'None';
      this.selectedInfo.textContent = `Selected fragment: ${selectedName}.`;
    }

    if (this.summaryInfo) {
      this.summaryInfo.textContent = `Aligned pedestals ${countCorrectPlacements(this.puzzle, this.arrangement)}/5. Attempts ${snapshot.miniPuzzleAttempts}. Hints ${snapshot.hintsUsed}.`;
    }

    if (this.footerPanel && this.footerText) {
      this.footerPanel.className = `ui-panel status-panel${
        this.statusTone !== 'neutral' ? ` ui-panel--${this.statusTone}` : ''
      }`;
      this.footerPanel.hidden = this.statusDismissed;
      this.footerText.textContent = this.statusMessage;
    }

    if (this.hintButton) {
      this.hintButton.disabled = this.solved;
    }

    if (this.resetButton) {
      this.resetButton.disabled = this.solved;
    }

    if (this.testButton) {
      this.testButton.disabled = this.solved;
    }

    if (this.enterMazeButton) {
      this.enterMazeButton.disabled = !this.solved;
      this.enterMazeButton.textContent = this.solved ? 'Carry Key into Maze' : 'Enter the Maze';
    }

    this.renderRules();
  }

  private renderRules(): void {
    if (!this.ruleList) {
      return;
    }

    this.ruleList.replaceChildren();

    this.puzzle.rules.forEach((rule, index) => {
      const evaluation = this.lastEvaluations?.[index];
      const toneClass = evaluation ? (evaluation.satisfied ? ' rule-card--success' : ' rule-card--danger') : '';
      this.ruleList?.append(el('div', `rule-card${toneClass}`, rule.description));
    });
  }

  private selectFragment(fragmentId: string): void {
    if (this.solved || this.isFragmentPlaced(fragmentId)) {
      return;
    }

    this.selectedFragmentId = this.selectedFragmentId === fragmentId ? null : fragmentId;
    this.refreshView();
  }

  private handleSlotClick(slotIndex: number): void {
    if (this.solved || this.lockedSlots.has(slotIndex)) {
      return;
    }

    if (this.selectedFragmentId !== null) {
      const displacedId = this.arrangement[slotIndex];
      this.arrangement[slotIndex] = this.selectedFragmentId;
      this.selectedFragmentId = displacedId;
      this.lastEvaluations = null;
      this.refreshView();
      return;
    }

    if (this.arrangement[slotIndex] !== null) {
      this.arrangement[slotIndex] = null;
      this.lastEvaluations = null;
      this.refreshView();
    }
  }

  private testSequence(): void {
    if (this.solved) {
      return;
    }

    if (!isArrangementComplete(this.arrangement)) {
      this.setStatusMessage(
        'All five pedestals must hold a rune before the egg can judge the sequence.',
        'warning'
      );
      this.lastEvaluations = null;
      this.cameras.main.shake(90, 0.0012);
      this.refreshView();
      return;
    }

    runState.recordMiniPuzzleAttempt();
    this.lastEvaluations = evaluateArrangement(this.puzzle, this.arrangement);

    if (isSolvedArrangement(this.puzzle, this.arrangement)) {
      this.solved = true;
      runState.setKeyWord(this.puzzle.keyWord);
      this.setStatusMessage(
        'The omen cards resolve into a single harmony. The egg opens and the maze key burns into memory.',
        'success'
      );
      this.lockedSlots.clear();
      this.puzzle.solutionOrder.forEach((_, index) => this.lockedSlots.add(index));
      this.cameras.main.flash(220, 212, 177, 90, false);
      this.tweens.add({
        targets: [this.worldFrame, this.worldGlow],
        scaleX: 1.03,
        scaleY: 1.03,
        yoyo: true,
        duration: 240
      });
      this.refreshView();
      return;
    }

    const failingRules = this.lastEvaluations.filter((evaluation) => !evaluation.satisfied).length;
    const correctPlacements = countCorrectPlacements(this.puzzle, this.arrangement);
    this.setStatusMessage(
      `The egg resists. ${failingRules} omen card${failingRules === 1 ? ' still conflicts' : 's still conflict'}, and ${correctPlacements} of 5 pedestals are aligned correctly.`,
      'danger'
    );
    this.cameras.main.shake(110, 0.0014);
    this.refreshView();
  }

  private applyHint(): void {
    if (this.solved) {
      return;
    }

    const hintPlacement = getFirstHintPlacement(this.puzzle, this.arrangement);

    if (!hintPlacement) {
      this.setStatusMessage('The egg has no clearer omen to offer. Test the sequence instead.', 'warning');
      return;
    }

    const existingSlot = this.arrangement.findIndex((fragmentId) => fragmentId === hintPlacement.fragmentId);
    if (existingSlot !== -1 && existingSlot !== hintPlacement.slotIndex && !this.lockedSlots.has(existingSlot)) {
      this.arrangement[existingSlot] = null;
    }

    this.arrangement[hintPlacement.slotIndex] = hintPlacement.fragmentId;
    this.lockedSlots.add(hintPlacement.slotIndex);
    this.selectedFragmentId = null;
    this.lastEvaluations = null;
    runState.recordHint(this.puzzle.hintPenaltyMs);

    const hintedFragment = this.puzzle.fragments.find(
      (fragment) => fragment.id === hintPlacement.fragmentId
    );
    this.setStatusMessage(
      `The egg seals ${hintedFragment?.label ?? 'a rune'} onto pedestal ${hintPlacement.slotIndex + 1}. Penalty applied: ${formatPenalty(this.puzzle.hintPenaltyMs)}.`,
      'warning'
    );
    this.cameras.main.flash(120, 212, 177, 90, false);
    this.tweens.add({
      targets: this.slotViews[hintPlacement.slotIndex].background,
      scaleX: 1.05,
      scaleY: 1.05,
      yoyo: true,
      duration: 170
    });
    this.refreshView();
  }

  private resetBoard(): void {
    if (this.solved) {
      return;
    }

    this.arrangement = this.arrangement.map((fragmentId, index) =>
      this.lockedSlots.has(index) ? fragmentId : null
    );
    this.selectedFragmentId = null;
    this.lastEvaluations = null;
    this.setStatusMessage('The loose fragments drift free. Locked hint pedestals remain in place.', 'neutral');
    this.refreshView();
  }

  private refreshView(): void {
    const snapshot = runState.getSnapshot();

    this.fragmentButtons.forEach((view) => {
      const selected = this.selectedFragmentId === view.fragmentId;
      const placed = this.isFragmentPlaced(view.fragmentId);
      const enabled = !this.solved && !placed;

      view.background.setFillStyle(
        selected ? THEME.colors.moss : placed ? THEME.colors.stone : THEME.colors.panelAlt,
        selected ? 1 : 0.96
      );
      view.background.setStrokeStyle(2, THEME.colors.gold, selected ? 0.75 : placed ? 0.14 : 0.35);
      view.container.setAlpha(enabled ? 1 : 0.52);

      if (view.hitZone.input) {
        view.hitZone.input.enabled = enabled;
      }
    });

    this.slotViews.forEach((view, index) => {
      const fragmentId = this.arrangement[index];
      const fragment = this.puzzle.fragments.find((entry) => entry.id === fragmentId) ?? null;
      const locked = this.lockedSlots.has(index);

      view.background.setFillStyle(
        locked ? THEME.colors.moss : fragment ? THEME.colors.panelAlt : THEME.colors.panel,
        0.96
      );
      view.background.setStrokeStyle(2, THEME.colors.gold, locked ? 0.72 : fragment ? 0.5 : 0.28);
      view.fragmentText.setText(fragment ? fragment.sigil : '---');
      view.fragmentText.setColor(fragment ? THEME.css.parchment : THEME.css.mist);
      view.lockText.setText(locked ? 'Locked' : '');

      if (view.background.input) {
        view.background.input.enabled = !this.solved && !locked;
      }
    });

    this.keyHudValue && (this.keyHudValue.textContent = snapshot.keyWord ?? 'Locked');
    this.refreshOverlay();
  }

  private setStatusMessage(message: string, tone: StatusTone): void {
    this.statusTone = tone;
    this.statusMessage = message;
    this.statusDismissed = false;
    this.refreshOverlay();
  }

  private isFragmentPlaced(fragmentId: string): boolean {
    return this.arrangement.includes(fragmentId);
  }

  private createRuneGlyph(fragment: RuneFragment, x: number, y: number): Phaser.GameObjects.Graphics {
    const glyph = this.add.graphics({ x, y });
    glyph.lineStyle(2, THEME.colors.parchment, 1);
    glyph.fillStyle(THEME.colors.parchment, 1);

    switch (fragment.id) {
      case 'ember':
        glyph.beginPath();
        glyph.moveTo(0, -11);
        glyph.lineTo(7, -2);
        glyph.lineTo(4, 9);
        glyph.lineTo(0, 12);
        glyph.lineTo(-5, 8);
        glyph.lineTo(-8, -1);
        glyph.closePath();
        glyph.fillPath();
        glyph.fillStyle(THEME.colors.gold, 0.9);
        glyph.fillTriangle(-1, -5, 3, 1, -1, 6);
        break;
      case 'moon':
        glyph.fillCircle(0, 0, 9);
        glyph.fillStyle(THEME.colors.moss, 1);
        glyph.fillCircle(4, -2, 8);
        glyph.fillStyle(THEME.colors.parchment, 1);
        glyph.fillCircle(-5, -7, 1.4);
        break;
      case 'mist':
        [-5, 0, 5].forEach((offsetY) => {
          glyph.strokePoints(
            [
              new Phaser.Geom.Point(-9, offsetY),
              new Phaser.Geom.Point(-4, offsetY - 4),
              new Phaser.Geom.Point(0, offsetY),
              new Phaser.Geom.Point(5, offsetY + 4),
              new Phaser.Geom.Point(9, offsetY)
            ],
            false,
            false
          );
        });
        break;
      case 'crown':
        glyph.beginPath();
        glyph.moveTo(-10, 7);
        glyph.lineTo(-10, 2);
        glyph.lineTo(-5, -6);
        glyph.lineTo(0, 1);
        glyph.lineTo(5, -8);
        glyph.lineTo(10, 2);
        glyph.lineTo(10, 7);
        glyph.closePath();
        glyph.strokePath();
        glyph.lineStyle(2, THEME.colors.gold, 1);
        glyph.strokeLineShape(new Phaser.Geom.Line(-10, 7, 10, 7));
        break;
      case 'thorn':
        glyph.lineStyle(2, THEME.colors.parchment, 1);
        glyph.strokeLineShape(new Phaser.Geom.Line(-8, 9, 8, -9));
        glyph.strokeLineShape(new Phaser.Geom.Line(-6, -5, -1, -8));
        glyph.strokeLineShape(new Phaser.Geom.Line(-1, 0, 4, -3));
        glyph.strokeLineShape(new Phaser.Geom.Line(2, 5, 7, 2));
        glyph.strokeLineShape(new Phaser.Geom.Line(-3, 4, -8, 1));
        break;
      default:
        glyph.fillCircle(0, 0, 6);
        break;
    }

    return glyph;
  }
}
