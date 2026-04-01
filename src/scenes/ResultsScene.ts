import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/sceneKeys';
import { formatDuration, formatPenalty } from '../core/time';
import { runState } from '../systems/RunState';
import { drawSceneBackdrop } from '../ui/backdrop';
import {
  createButton,
  createButtonRow,
  createPanel,
  createStatStrip,
  el
} from '../ui/domUi';
import { overlayController, type OverlayViewHandle } from '../ui/overlay';
import { fadeToScene, playSceneEnter } from '../ui/transitions';

export class ResultsScene extends Phaser.Scene {
  private overlay?: OverlayViewHandle;

  constructor() {
    super(SCENE_KEYS.RESULTS);
  }

  create(): void {
    runState.setPhase('results');
    drawSceneBackdrop(this);
    this.drawWorldFraming();
    playSceneEnter(this);
    this.createOverlay();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.overlay?.destroy();
      this.overlay = undefined;
    });
  }

  private createOverlay(): void {
    const snapshot = runState.getSnapshot();
    const performanceSummary = this.getPerformanceSummary(snapshot);

    this.overlay = overlayController.show(this.scene.key, {
      layout: 'center',
      sceneClass: 'scene-results'
    });

    const stats = createStatStrip([
      { key: 'time', label: 'Final Time', value: formatDuration(snapshot.elapsedMs), accent: 'gold' },
      { key: 'penalty', label: 'Penalty Time', value: formatPenalty(snapshot.penaltyMs) },
      { key: 'wrong', label: 'Wrong Turns', value: `${snapshot.wrongTurns}` },
      { key: 'markers', label: 'Markers Cleared', value: `${snapshot.currentCheckpoint}/${snapshot.totalCheckpoints}` },
      { key: 'key', label: 'Key', value: snapshot.keyWord ?? 'None', accent: 'success' }
    ]);

    const splits = el('div', 'results-splits');

    if (snapshot.checkpointSplits.length === 0) {
      splits.append(
        createPanel(
          { title: 'Checkpoint Splits' },
          el('p', 'ui-panel__description', 'No marker splits were recorded for this run.')
        )
      );
    } else {
      snapshot.checkpointSplits.forEach((split) => {
        const card = el('article', 'split-card');
        card.append(
          el('div', 'split-card__title', `${split.checkpointNumber}. ${split.title.replace(/^Checkpoint [IVX]+:\s*/, '')}`),
          el('div', 'split-card__time', formatDuration(split.elapsedMs)),
          el('div', 'split-card__delta', `Split ${formatPenalty(split.splitMs)}`)
        );
        splits.append(card);
      });
    }

    const actionRow = createButtonRow(
      createButton({
        label: 'Play Again',
        onClick: () =>
          fadeToScene(this, SCENE_KEYS.TITLE, () => {
            runState.reset();
          })
      })
    );

    const summary = createPanel(
      { className: 'results-shell' },
      el('div', 'ui-panel__eyebrow', 'Trial Complete'),
      el('h1', 'ui-hero-title', 'The Cup Is Yours'),
      el('p', 'ui-hero-subtitle', performanceSummary),
      stats.root,
      createPanel(
        { title: 'Run Notes' },
        el(
          'p',
          'ui-panel__description',
          `Mini-puzzle attempts: ${snapshot.miniPuzzleAttempts}. Hints used: ${snapshot.hintsUsed}. Every penalty stayed on the clock, so a cleaner line can still beat this finish.`
        )
      ),
      createPanel({ title: 'Checkpoint Splits' }, splits),
      el(
        'p',
        'ui-note',
        'Replay goal: solve earlier, avoid recovery loops, and carry the decoder rhythm all the way through the late markers.'
      ),
      actionRow
    );

    this.overlay.main.append(summary);
  }

  private drawWorldFraming(): void {
    const graphics = this.add.graphics();
    const glow = this.add.ellipse(0, 0, 0, 0, 0xd4b15a, 0.18);

    const redraw = () => {
      const { width, height } = this.scale;

      graphics.clear();
      glow.setPosition(width * 0.5, height * 0.32).setSize(width * 0.18, height * 0.22);

      graphics.lineStyle(18, 0x214b34, 0.8);
      graphics.strokeRoundedRect(width * 0.18, height * 0.2, width * 0.64, height * 0.54, 40);
      graphics.fillStyle(0x10291c, 0.42);
      graphics.fillEllipse(width * 0.5, height * 0.62, width * 0.52, height * 0.22);

      graphics.fillStyle(0xd4b15a, 0.94);
      graphics.fillTriangle(width * 0.46, height * 0.34, width * 0.54, height * 0.34, width * 0.5, height * 0.22);
      graphics.fillRoundedRect(width * 0.475, height * 0.34, width * 0.05, height * 0.1, 10);
      graphics.fillRoundedRect(width * 0.49, height * 0.44, width * 0.02, height * 0.08, 4);
      graphics.fillRoundedRect(width * 0.458, height * 0.52, width * 0.084, height * 0.024, 8);
    };

    redraw();

    const resizeHandler = () => redraw();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
    });
  }

  private getPerformanceSummary(snapshot: ReturnType<typeof runState.getSnapshot>): string {
    if (snapshot.wrongTurns === 0 && snapshot.hintsUsed === 0) {
      return 'Clean route. The maze never forced you to recover.';
    }

    if (snapshot.wrongTurns <= 1 && snapshot.penaltyMs <= 15000) {
      return 'Strong pace. A cleaner final line could still cut this time noticeably.';
    }

    return 'Recoverable run. Most of the remaining time is still hiding inside wrong turns and penalties.';
  }
}
