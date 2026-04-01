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
import { createPanel } from '../ui/panel';
import { RunHud } from '../ui/runHud';

type FragmentButtonView = {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  sigilText: Phaser.GameObjects.Text;
  labelText: Phaser.GameObjects.Text;
  loreText: Phaser.GameObjects.Text;
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
  text: Phaser.GameObjects.Text;
};

export class MiniPuzzleScene extends Phaser.Scene {
  private readonly puzzle = runeSequencePuzzle;
  private arrangement: Arrangement = createEmptyArrangement(this.puzzle.solutionOrder.length);
  private readonly lockedSlots = new Set<number>();
  private readonly fragmentButtons = new Map<string, FragmentButtonView>();
  private readonly slotViews: SlotView[] = [];
  private readonly clueViews: ClueView[] = [];
  private hud!: RunHud;
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

    if (runState.hasUnlockedKey() && runState.getSnapshot().keyWord === this.puzzle.keyWord) {
      this.arrangement = [...this.puzzle.solutionOrder];
      this.solved = true;
      this.puzzle.solutionOrder.forEach((_, index) => this.lockedSlots.add(index));
    } else {
      this.arrangement = createEmptyArrangement(this.puzzle.solutionOrder.length);
      this.lockedSlots.clear();
      this.solved = false;
    }

    const { width } = this.scale;
    this.hud = new RunHud(this, 'Phase 1: Key Unlock');

    this.add
      .text(86, 92, this.puzzle.title, {
        fontFamily: THEME.fonts.display,
        fontSize: '54px',
        color: THEME.css.parchment
      })
      .setOrigin(0, 0.5);

    this.add
      .text(86, 146, this.puzzle.objective, {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.mist,
        wordWrap: { width: 780 },
        lineSpacing: 6
      })
      .setOrigin(0, 0);

    createPanel(this, 390, 520, 640, 620, {
      label: 'Artifact Chamber',
      fillAlpha: 0.9
    });
    createPanel(this, 1060, 520, 560, 620, {
      label: 'Omen Cards',
      fillAlpha: 0.92
    });

    this.drawArtifact();
    this.createFragmentButtons();
    this.createSlotViews();
    this.createClueViews();

    this.selectedText = this.add
      .text(390, 470, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);

    this.summaryText = this.add
      .text(390, 748, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '22px',
        color: THEME.css.mist,
        align: 'center'
      })
      .setOrigin(0.5);

    this.keyRevealText = this.add
      .text(1060, 180, 'Cipher Key Locked', {
        fontFamily: THEME.fonts.display,
        fontSize: '42px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(1060, 650, '', {
        fontFamily: THEME.fonts.body,
        fontSize: '24px',
        color: THEME.css.parchment,
        align: 'center',
        wordWrap: { width: 470 },
        lineSpacing: 8
      })
      .setOrigin(0.5);

    this.hintButton = createTextButton(
      this,
      width - 470,
      774,
      180,
      64,
      'Take Hint',
      () => this.applyHint(),
      {
        fontSize: '22px'
      }
    );

    this.testButton = createTextButton(
      this,
      width - 260,
      774,
      220,
      64,
      'Test Sequence',
      () => this.testSequence(),
      {
        fontSize: '22px'
      }
    );

    this.resetButton = createTextButton(
      this,
      276,
      774,
      180,
      64,
      'Clear Slots',
      () => this.resetBoard(),
      {
        fontSize: '22px'
      }
    );

    this.enterMazeButton = createTextButton(
      this,
      1060,
      844,
      300,
      72,
      'Enter the Maze',
      () => this.scene.start(SCENE_KEYS.MAZE)
    );

    if (this.solved) {
      this.lastEvaluations = evaluateArrangement(this.puzzle, this.arrangement);
      this.statusText.setText('The egg is already aligned and humming with stored light.');
      this.keyRevealText.setText(`Cipher Key Revealed\n${this.puzzle.keyWord}`);
    }

    this.refreshView();
  }

  update(): void {
    this.hud.refresh();
  }

  private drawArtifact(): void {
    this.add.ellipse(390, 250, 240, 320, THEME.colors.panelAlt, 1).setStrokeStyle(4, THEME.colors.gold, 0.42);
    this.add.ellipse(390, 250, 182, 260, THEME.colors.midnight, 0.94).setStrokeStyle(2, THEME.colors.gold, 0.22);
    this.add.ellipse(390, 220, 100, 130, THEME.colors.gold, 0.12).setBlendMode(Phaser.BlendModes.SCREEN);
    this.add
      .text(390, 240, this.puzzle.artifactName, {
        fontFamily: THEME.fonts.display,
        fontSize: '34px',
        color: THEME.css.gold,
        align: 'center'
      })
      .setOrigin(0.5);

    this.add
      .text(390, 320, this.puzzle.interactionHint, {
        fontFamily: THEME.fonts.body,
        fontSize: '22px',
        color: THEME.css.mist,
        align: 'center',
        wordWrap: { width: 420 },
        lineSpacing: 6
      })
      .setOrigin(0.5);
  }

  private createFragmentButtons(): void {
    const positions = [
      { x: 248, y: 522 },
      { x: 390, y: 522 },
      { x: 532, y: 522 },
      { x: 320, y: 612 },
      { x: 460, y: 612 }
    ];

    this.puzzle.fragments.forEach((fragment, index) => {
      const position = positions[index];
      const background = this.add
        .rectangle(0, 0, 126, 76, THEME.colors.panelAlt, 0.98)
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
          color: THEME.css.parchment
        })
        .setOrigin(0.5);
      const loreText = this.add
        .text(18, 15, fragment.lore, {
          fontFamily: THEME.fonts.body,
          fontSize: '13px',
          color: THEME.css.mist,
          align: 'center',
          wordWrap: { width: 78 }
        })
        .setOrigin(0.5);

      const container = this.add.container(position.x, position.y, [
        background,
        sigilText,
        labelText,
        loreText
      ]);

      container.setSize(126, 76);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-63, -38, 126, 76),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerdown', () => this.selectFragment(fragment.id));

      this.fragmentButtons.set(fragment.id, {
        container,
        background,
        sigilText,
        labelText,
        loreText,
        fragmentId: fragment.id
      });
    });
  }

  private createSlotViews(): void {
    const startX = 182;

    for (let index = 0; index < this.puzzle.solutionOrder.length; index += 1) {
      const x = startX + index * 104;
      const background = this.add
        .rectangle(x, 688, 92, 108, THEME.colors.panel, 0.94)
        .setStrokeStyle(2, THEME.colors.gold, 0.28);
      const slotText = this.add
        .text(x, 650, `Pedestal ${index + 1}`, {
          fontFamily: THEME.fonts.body,
          fontSize: '18px',
          color: THEME.css.mist
        })
        .setOrigin(0.5);
      const fragmentText = this.add
        .text(x, 692, 'Empty', {
          fontFamily: THEME.fonts.display,
          fontSize: '22px',
          color: THEME.css.parchment,
          align: 'center'
        })
        .setOrigin(0.5);
      const lockText = this.add
        .text(x, 728, '', {
          fontFamily: THEME.fonts.body,
          fontSize: '16px',
          color: THEME.css.gold
        })
        .setOrigin(0.5);

      background.setInteractive();
      background.on('pointerdown', () => this.handleSlotClick(index));

      this.slotViews.push({
        background,
        slotText,
        fragmentText,
        lockText
      });
    }
  }

  private createClueViews(): void {
    this.puzzle.rules.forEach((rule, index) => {
      const y = 284 + index * 86;
      const background = this.add
        .rectangle(1060, y, 480, 70, THEME.colors.panelAlt, 0.96)
        .setStrokeStyle(2, THEME.colors.gold, 0.28);
      const text = this.add
        .text(1060, y, rule.description, {
          fontFamily: THEME.fonts.body,
          fontSize: '22px',
          color: THEME.css.parchment,
          align: 'center',
          wordWrap: { width: 430 }
        })
        .setOrigin(0.5);

      this.clueViews.push({ background, text });
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
      this.statusText.setText('All five pedestals must hold a rune before the egg can judge the sequence.');
      this.lastEvaluations = null;
      this.refreshView();
      return;
    }

    runState.recordMiniPuzzleAttempt();
    this.lastEvaluations = evaluateArrangement(this.puzzle, this.arrangement);

    if (isSolvedArrangement(this.puzzle, this.arrangement)) {
      this.solved = true;
      runState.setKeyWord(this.puzzle.keyWord);
      this.keyRevealText.setText(`Cipher Key Revealed\n${this.puzzle.keyWord}`);
      this.statusText.setText(
        'The omen cards resolve into a single harmony. The egg opens and the maze key burns into memory.'
      );
      this.lockedSlots.clear();
      this.puzzle.solutionOrder.forEach((_, index) => this.lockedSlots.add(index));
      this.cameras.main.flash(220, 212, 177, 90, false);
      this.tweens.add({
        targets: this.keyRevealText,
        scaleX: 1.08,
        scaleY: 1.08,
        yoyo: true,
        duration: 260
      });
      this.refreshView();
      return;
    }

    const failingRules = this.lastEvaluations.filter((evaluation) => !evaluation.satisfied).length;
    const correctPlacements = countCorrectPlacements(this.puzzle, this.arrangement);
    this.statusText.setText(
      `The egg resists. ${failingRules} omen card${failingRules === 1 ? ' still conflicts' : 's still conflict'}, and ${correctPlacements} of 5 pedestals are aligned correctly.`
    );
    this.refreshView();
  }

  private applyHint(): void {
    if (this.solved) {
      return;
    }

    const hintPlacement = getFirstHintPlacement(this.puzzle, this.arrangement);

    if (!hintPlacement) {
      this.statusText.setText('The egg has no clearer omen to offer. Test the sequence instead.');
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
    this.statusText.setText(
      `The egg seals ${hintedFragment?.label ?? 'a rune'} onto pedestal ${hintPlacement.slotIndex + 1}. Penalty applied: ${formatPenalty(this.puzzle.hintPenaltyMs)}.`
    );
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
    this.statusText.setText('The loose fragments drift free. The locked hint pedestals remain in place.');
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
      view.container.setAlpha(enabled ? 1 : 0.5);

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
        evaluation.satisfied ? 0.7 : 0.46
      );
      view.background.setStrokeStyle(2, THEME.colors.gold, evaluation.satisfied ? 0.56 : 0.36);
    });

    this.selectedText.setText(
      this.selectedFragmentId
        ? `Selected fragment: ${this.puzzle.fragments.find((fragment) => fragment.id === this.selectedFragmentId)?.label}`
        : 'Selected fragment: none'
    );

    this.summaryText.setText(
      `Pedestals aligned: ${countCorrectPlacements(this.puzzle, this.arrangement)}/5   |   Attempts: ${snapshot.miniPuzzleAttempts}   |   Hints: ${snapshot.hintsUsed}`
    );

    if (this.solved) {
      this.enterMazeButton.setEnabled(true);
      this.hintButton.setEnabled(false);
      this.testButton.setEnabled(false);
      this.resetButton.setEnabled(false);
      return;
    }

    this.enterMazeButton.setEnabled(false);
    this.hintButton.setEnabled(true);
    this.testButton.setEnabled(true);
    this.resetButton.setEnabled(true);

    if (!this.statusText.text) {
      this.statusText.setText('Arrange the runes, then test the omen cards against the egg.');
    }
  }

  private isFragmentPlaced(fragmentId: string): boolean {
    return this.arrangement.includes(fragmentId);
  }
}
