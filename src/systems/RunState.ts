export type RunPhase = 'title' | 'intro' | 'mini-puzzle' | 'maze' | 'results';

export type CheckpointSplit = {
  checkpointId: string;
  title: string;
  checkpointNumber: number;
  elapsedMs: number;
  splitMs: number;
};

type InternalRunState = {
  phase: RunPhase;
  active: boolean;
  keyWord: string | null;
  miniPuzzleSolved: boolean;
  miniPuzzleAttempts: number;
  penaltyMs: number;
  wrongTurns: number;
  hintsUsed: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  checkpointSplits: CheckpointSplit[];
  finalTimeMs: number | null;
};

export type RunSnapshot = InternalRunState & {
  elapsedMs: number;
};

const createInitialState = (): InternalRunState => ({
  phase: 'title',
  active: false,
  keyWord: null,
  miniPuzzleSolved: false,
  miniPuzzleAttempts: 0,
  penaltyMs: 0,
  wrongTurns: 0,
  hintsUsed: 0,
  currentCheckpoint: 0,
  totalCheckpoints: 0,
  checkpointSplits: [],
  finalTimeMs: null
});

class RunStateStore {
  private state: InternalRunState = createInitialState();
  private startedAtMs: number | null = null;

  reset(): void {
    this.state = createInitialState();
    this.startedAtMs = null;
  }

  startRun(): void {
    this.state = createInitialState();
    this.state.active = true;
    this.state.phase = 'mini-puzzle';
    this.startedAtMs = performance.now();
  }

  setPhase(phase: RunPhase): void {
    this.state.phase = phase;
  }

  setKeyWord(keyWord: string): void {
    this.state.keyWord = keyWord;
    this.state.miniPuzzleSolved = true;
  }

  hasUnlockedKey(): boolean {
    return this.state.miniPuzzleSolved && this.state.keyWord !== null;
  }

  recordMiniPuzzleAttempt(): void {
    this.state.miniPuzzleAttempts += 1;
  }

  setCheckpointProgress(currentCheckpoint: number, totalCheckpoints: number): void {
    this.state.currentCheckpoint = currentCheckpoint;
    this.state.totalCheckpoints = totalCheckpoints;
  }

  recordCheckpointClear(checkpointId: string, title: string, checkpointNumber: number): void {
    const existingSplit = this.state.checkpointSplits.find((split) => split.checkpointId === checkpointId);
    if (existingSplit) {
      return;
    }

    const elapsedMs = this.getElapsedMs();
    const previousElapsedMs =
      this.state.checkpointSplits.length > 0
        ? this.state.checkpointSplits[this.state.checkpointSplits.length - 1].elapsedMs
        : 0;

    this.state.checkpointSplits.push({
      checkpointId,
      title,
      checkpointNumber,
      elapsedMs,
      splitMs: elapsedMs - previousElapsedMs
    });
  }

  addPenalty(ms: number): void {
    this.state.penaltyMs += ms;
  }

  recordWrongTurn(): void {
    this.state.wrongTurns += 1;
  }

  recordHint(penaltyMs = 0): void {
    this.state.hintsUsed += 1;

    if (penaltyMs > 0) {
      this.addPenalty(penaltyMs);
    }
  }

  completeRun(): void {
    this.state.finalTimeMs = this.getElapsedMs();
    this.state.active = false;
    this.state.phase = 'results';
  }

  getElapsedMs(now = performance.now()): number {
    if (this.state.finalTimeMs !== null) {
      return this.state.finalTimeMs;
    }

    if (this.startedAtMs === null) {
      return 0;
    }

    return Math.max(0, Math.round(now - this.startedAtMs) + this.state.penaltyMs);
  }

  getSnapshot(now = performance.now()): RunSnapshot {
    return {
      ...this.state,
      elapsedMs: this.getElapsedMs(now)
    };
  }
}

export const runState = new RunStateStore();
