import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatPenalty } from '../core/time';
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
import { runeSequencePuzzle } from '../puzzles/runeSequencePuzzle';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import { createTextButton, type TextButton } from '../ui/button';
import { fitIntoBox, getSceneLayoutMetrics } from '../ui/layout';
import { RunHud } from '../ui/runHud';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

type FragmentButtonView = {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  fragmentId: string;
};

type SlotView = {
  background: Phaser.GameObjects.Rectangle;
  slotText: Phaser.GameObjects.Text;
  fragmentText: Phaser.GameObjects.Text;
  lockText: Phaser.GameObjects.Text;
};

type ClueView = {
  background: Phaser.GameObjects.Rectangle;
};

const LEFT_PANEL_BASE = { width: 640, height: 620 };
const RIGHT_PANEL_BASE = { width: 560, height: 620 };

export class MiniPuzzleScene extends Phaser.Scene {
  private readonly puzzle = runeSequencePuzzle;
  private arrangement: Arrangement = createEmptyArrangement(this.puzzle.solutionOrder.length);
  private readonly lockedSlots = new Set<number>();
  private readonly fragmentButtons = new Map<string, FragmentButtonView>();
  private readonly slotViews: SlotView[] = [];
  private readonly clueViews: ClueView[] = [];
  private hud!: RunHud;
  private titleText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private leftPanel!: Phaser.GameObjects.Rectangle;
  private leftPanelLabel!: Phaser.GameObjects.Text;
  private rightPanel!: Phaser.GameObjects.Rectangle;
  private rightPanelLabel!: Phaser.GameObjects.Text;
  private leftContent!: Phaser.GameObjects.Container;
  private rightContent!: Phaser.GameObjects.Container;
  private keyRevealText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private selectedText!: Phaser.GameObjects.Text;
  private summaryText!: Phaser.GameObjects.Text;
  private enterMazeButton!: TextButton;
  private hintButton!: TextButton;
  private testButton!: TextButton;
  private resetButton!: TextButton;
  private selectedFragmentId: string | null = null;
  private lastEvaluations: RuleEvaluation[] | null = null;
  private solved = false;

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

    if (runState.hasUnlockedKey() && runState.getSnapshot().keyWord === this.puzzle.keyWord) {
      this.arrangement = [...this.puzzle.solutionOrder];
      this.solved = true;
      this.puzzle.solutionOrder.forEach((_, index) => this.lockedSlots.add(index));
    } else {
      this.arrangement = createEmptyArrangement(this.puzzle.solutionOrder.length);
      this.lockedSlots.clear();
      this.solved = false;
    }

    this.hud = new RunHud(this, 'Phase 1: Key Unlock');
    this.createLayout();

    if (this.solved) {
      this.lastEvaluations = evaluateArrangement(this.puzzle, this.arrangement);
      this.setStatusMessage('The egg is already aligned and humming with stored light.', 'success');
      this.keyRevealText.setText(`Cipher Key Revealed\n${this.puzzle.keyWord}`);
    }

    this.layoutScene();
    this.refreshView();

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
    this.titleText = this.add.text(0, 0, this.puzzle.title, {
      fontFamily: THEME.fonts.display,
      fontSize: '54px',
      color: THEME.css.parchment
    });

    this.objectiveText = this.add.text(0, 0, this.puzzle.objective, {
      fontFamily: THEME.fonts.body,
      fontSize: '23px',
      color: THEME.css.mist,
      lineSpacing: 6
    });

    this.leftPanel = this.add
      .rectangle(0, 0, LEFT_PANEL_BASE.width, LEFT_PANEL_BASE.height, THEME.colors.panel, 0.9)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.leftPanelLabel = this.add.text(0, 0, 'Artifact Chamber', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.rightPanel = this.add
      .rectangle(0, 0, RIGHT_PANEL_BASE.width, RIGHT_PANEL_BASE.height, THEME.colors.panel, 0.92)
      .setStrokeStyle(2, THEME.colors.gold, 0.3);
    this.rightPanelLabel = this.add.text(0, 0, 'Omen Cards', {
      fontFamily: THEME.fonts.body,
      fontSize: '20px',
      color: THEME.css.gold,
      fontStyle: 'bold'
    });

    this.leftContent = this.add.container(0, 0);
    this.rightContent = this.add.container(0, 0);

    this.buildLeftContent();
    this.buildRightContent();

    this.resetButton = createTextButton(this, 0, 0, 170, 62, 'Clear Slots', () => this.resetBoard(), {
      fontSize: '22px'
    });
    this.hintButton = createTextButton(this, 0, 0, 170, 62, 'Take Hint', () => this.applyHint(), {
      fontSize: '22px'
    });
    this.testButton = createTextButton(this, 0, 0, 210, 62, 'Test Sequence', () => this.testSequence(), {
      fontSize: '22px'
    });
    this.enterMazeButton = createTextButton(
      this,
      0,
      0,
      250,
      68,
      'Enter the Maze',
      () => fadeToScene(this, SCENE_KEYS.MAZE)
    );
  }

  private buildLeftContent(): void {
    const content = this.leftContent;

    content.add(
      this.add
        .ellipse(0, -210, 240, 320, THEME.colors.panelAlt, 1)
        .setStrokeStyle(4, THEME.colors.gold, 0.42)
    );
    content.add(
      this.add
        .ellipse(0, -210, 182, 260, THEME.colors.midnight, 0.94)
        .setStrokeStyle(2, THEME.colors.gold, 0.22)
    );
    content.add(
      this.add
        .ellipse(0, -240, 100, 130, THEME.colors.gold, 0.12)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    );
    content.add(
      this.add
        .text(0, -220, this.puzzle.artifactName, {
          fontFamily: THEME.fonts.display,
          fontSize: '34px',
          color: THEME.css.gold,
          align: 'center'
        })
        .setOrigin(0.5)
    );
    content.add(
      this.add
        .text(0, -146, this.puzzle.interactionHint, {
          fontFamily: THEME.fonts.body,
          fontSize: '20px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 410 },
          lineSpacing: 6
        })
        .setOrigin(0.5)
    );

    this.selectedText = this.add
      .text(0, -34, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '22px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    content.add(this.selectedText);

    const positions = [
      { x: -150, y: 54 },
      { x: 0, y: 54 },
      { x: 150, y: 54 },
      { x: -78, y: 146 },
      { x: 78, y: 146 }
    ];

    this.puzzle.fragments.forEach((fragment, index) => {
      const position = positions[index];
      const background = this.add
        .rectangle(0, 0, 132, 78, THEME.colors.panelAlt, 0.98)
        .setStrokeStyle(2, THEME.colors.gold, 0.35);
      const sigilText = this.add
        .text(-40, 0, fragment.sigil, {
          fontFamily: THEME.fonts.display,
          fontSize: '26px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);
      const labelText = this.add
        .text(18, -10, fragment.label, {
          fontFamily: THEME.fonts.body,
          fontSize: '18px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 84 }
        })
        .setOrigin(0.5);
      const loreText = this.add
        .text(18, 18, fragment.lore, {
          fontFamily: THEME.fonts.body,
          fontSize: '12px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 84 }
        })
        .setOrigin(0.5);

      const container = this.add.container(position.x, position.y, [
        background,
        sigilText,
        labelText,
        loreText
      ]);
      container.setSize(132, 78);
      container.setInteractive(new Phaser.Geom.Rectangle(-66, -39, 132, 78), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.selectFragment(fragment.id));
      content.add(container);

      this.fragmentButtons.set(fragment.id, {
        container,
        background,
        fragmentId: fragment.id
      });
    });

    this.summaryText = this.add
      .text(0, 224, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: THEME.css.mist,
        align: 'center'
      })
      .setOrigin(0.5);
    content.add(this.summaryText);

    const startX = -208;

    for (let index = 0; index < this.puzzle.solutionOrder.length; index += 1) {
      const x = startX + index * 104;
      const slotText = this.add
        .text(x, 246, `Pedestal ${index + 1}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '17px',
          color: THEME.css.mist
        })
        .setOrigin(0.5);
      const background = this.add
        .rectangle(x, 304, 92, 104, THEME.colors.panel, 0.94)
        .setStrokeStyle(2, THEME.colors.gold, 0.28);
      const fragmentText = this.add
        .text(x, 302, 'Empty', {
          fontFamily: THEME.fonts.display,
          fontSize: '21px',
          color: THEME.css.parchment,
          align: 'center'
        })
        .setOrigin(0.5);
      const lockText = this.add
        .text(x, 340, '', {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);

      background.setInteractive();
      background.on('pointerdown', () => this.handleSlotClick(index));
      content.add([slotText, background, fragmentText, lockText]);

      this.slotViews.push({
        background,
        slotText,
        fragmentText,
        lockText
      });
    }
  }

  private buildRightContent(): void {
    this.keyRevealText = this.add
      .text(0, -244, 'Cipher Key Locked', {
        fontFamily: THEME.fonts.display,
        fontSize: '40px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);
    this.rightContent.add(this.keyRevealText);

    this.puzzle.rules.forEach((rule, index) => {
      const y = -130 + index * 92;
      const background = this.add
        .rectangle(0, y, 470, 76, THEME.colors.panelAlt, 0.96)
        .setStrokeStyle(2, THEME.colors.gold, 0.28);
      const text = this.add
        .text(0, y, rule.description, {
          fontFamily: THEME.fonts.body,
          fontSize: '21px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 420 }
        })
        .setOrigin(0.5);

      this.rightContent.add([background, text]);
      this.clueViews.push({ background });
    });

    this.statusText = this.add
      .text(
        0,
        206,
        'Arrange the runes, then test the omen cards against the egg.',
        {
          fontFamily: THEME.fonts.body,
          fontSize: '23px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 430 },
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);
    this.rightContent.add(this.statusText);
  }

  private layoutScene(): void {
    const metrics = getSceneLayoutMetrics(this);
    const hudWidthReserve = Phaser.Math.Clamp(Math.round(metrics.width * 0.28), 320, 420) + metrics.gap;
    const titleWrapWidth = Math.max(380, metrics.width - metrics.padding * 2 - hudWidthReserve);

    this.titleText.setPosition(metrics.padding, metrics.padding + 12);
    this.objectiveText
      .setPosition(metrics.padding, metrics.padding + 66)
      .setWordWrapWidth(titleWrapWidth);

    const leftWidthInitial = Phaser.Math.Clamp(Math.round(metrics.usableWidth * 0.55), 500, 720);
    const rightWidth = Math.max(440, metrics.usableWidth - leftWidthInitial - metrics.gap);
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
      fitIntoBox(LEFT_PANEL_BASE.width, LEFT_PANEL_BASE.height, leftWidth - 30, panelHeight - 46, 1)
    );
    this.rightContent.setPosition(rightX, panelY).setScale(
      fitIntoBox(RIGHT_PANEL_BASE.width, RIGHT_PANEL_BASE.height, rightWidth - 30, panelHeight - 46, 1)
    );

    const buttonGap = metrics.gap;
    const buttonWidths = metrics.isCompact ? [150, 150, 180, 220] : [170, 170, 210, 250];
    const buttonHeights = metrics.isCompact ? [58, 58, 58, 64] : [62, 62, 62, 68];
    const totalButtonWidth =
      buttonWidths.reduce((total, width) => total + width, 0) + buttonGap * (buttonWidths.length - 1);
    const startX = metrics.width / 2 - totalButtonWidth / 2;
    const buttonY = metrics.height - metrics.padding - 38;
    const positions = buttonWidths.map((width, index) => {
      const offset =
        buttonWidths.slice(0, index).reduce((total, value) => total + value, 0) + buttonGap * index;
      return startX + width / 2 + offset;
    });

    [
      { button: this.resetButton, width: buttonWidths[0], height: buttonHeights[0], x: positions[0] },
      { button: this.hintButton, width: buttonWidths[1], height: buttonHeights[1], x: positions[1] },
      { button: this.testButton, width: buttonWidths[2], height: buttonHeights[2], x: positions[2] },
      { button: this.enterMazeButton, width: buttonWidths[3], height: buttonHeights[3], x: positions[3] }
    ].forEach(({ button, width, height, x }) => {
      button.setPosition(x, buttonY);
      const background = button.list[1] as Phaser.GameObjects.Rectangle;
      const glow = button.list[0] as Phaser.GameObjects.Rectangle;
      const text = button.list[2] as Phaser.GameObjects.Text;
      background.setSize(width, height);
      glow.setSize(width + 10, height + 10);
      text.setWordWrapWidth(width - 28);
      button.setSize(width, height);
      if (button.input?.hitArea instanceof Phaser.Geom.Rectangle) {
        button.input.hitArea.setTo(-width / 2, -height / 2, width, height);
      }
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
      this.keyRevealText.setText(`Cipher Key Revealed\n${this.puzzle.keyWord}`);
      this.setStatusMessage(
        'The omen cards resolve into a single harmony. The egg opens and the maze key burns into memory.',
        'success'
      );
      this.lockedSlots.clear();
      this.puzzle.solutionOrder.forEach((_, index) => this.lockedSlots.add(index));
      this.cameras.main.flash(220, 212, 177, 90, false);
      this.tweens.add({
        targets: [this.keyRevealText, this.rightPanel, this.enterMazeButton],
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
    this.tweens.add({
      targets: this.clueViews.map((view) => view.background),
      alpha: 0.84,
      yoyo: true,
      duration: 120
    });
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
    this.setStatusMessage('The loose fragments drift free. The locked hint pedestals remain in place.', 'neutral');
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

      if (view.container.input) {
        view.container.input.enabled = enabled;
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
      view.fragmentText.setText(fragment ? `${fragment.sigil}\n${fragment.label}` : 'Empty');
      view.fragmentText.setColor(fragment ? THEME.css.parchment : THEME.css.mist);
      view.lockText.setText(locked ? 'Locked' : '');

      if (view.background.input) {
        view.background.input.enabled = !this.solved && !locked;
      }
    });

    this.clueViews.forEach((view, index) => {
      const evaluation = this.lastEvaluations?.[index];
      if (!evaluation) {
        view.background.setFillStyle(THEME.colors.panelAlt, 0.96);
        view.background.setStrokeStyle(2, THEME.colors.gold, 0.28);
        return;
      }

      view.background.setFillStyle(
        evaluation.satisfied ? THEME.colors.moss : THEME.colors.danger,
        evaluation.satisfied ? 0.72 : 0.48
      );
      view.background.setStrokeStyle(2, THEME.colors.gold, evaluation.satisfied ? 0.56 : 0.34);
    });

    this.selectedText.setText(
      this.selectedFragmentId
        ? `Selected fragment: ${this.puzzle.fragments.find((fragment) => fragment.id === this.selectedFragmentId)?.label}`
        : 'Selected fragment: none'
    );

    this.summaryText.setText(
      `Aligned pedestals: ${countCorrectPlacements(this.puzzle, this.arrangement)}/5   |   Attempts: ${snapshot.miniPuzzleAttempts}   |   Hints: ${snapshot.hintsUsed}`
    );

    if (this.solved) {
      this.enterMazeButton.setLabel('Carry Key into Maze');
      this.enterMazeButton.setEnabled(true);
      this.hintButton.setEnabled(false);
      this.testButton.setEnabled(false);
      this.resetButton.setEnabled(false);
      return;
    }

    this.enterMazeButton.setLabel('Enter the Maze');
    this.enterMazeButton.setEnabled(false);
    this.hintButton.setEnabled(true);
    this.testButton.setEnabled(true);
    this.resetButton.setEnabled(true);
  }

  private setStatusMessage(
    message: string,
    tone: 'neutral' | 'success' | 'danger' | 'warning'
  ): void {
    const config =
      tone === 'success'
        ? { textColor: THEME.css.gold, fillColor: THEME.colors.moss, fillAlpha: 0.3, strokeAlpha: 0.58 }
        : tone === 'danger'
          ? { textColor: THEME.css.danger, fillColor: THEME.colors.danger, fillAlpha: 0.18, strokeAlpha: 0.42 }
          : tone === 'warning'
            ? { textColor: THEME.css.gold, fillColor: THEME.colors.ember, fillAlpha: 0.18, strokeAlpha: 0.38 }
            : { textColor: THEME.css.parchment, fillColor: THEME.colors.panel, fillAlpha: 0.92, strokeAlpha: 0.3 };

    this.statusText.setText(message).setColor(config.textColor);
    this.rightPanel.setFillStyle(config.fillColor, config.fillAlpha);
    this.rightPanel.setStrokeStyle(2, THEME.colors.gold, config.strokeAlpha);

    this.tweens.add({
      targets: this.statusText,
      alpha: 0.76,
      yoyo: true,
      duration: 120
    });
  }

  private isFragmentPlaced(fragmentId: string): boolean {
    return this.arrangement.includes(fragmentId);
  }
}
