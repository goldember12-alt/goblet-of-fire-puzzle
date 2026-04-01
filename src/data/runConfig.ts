export const DEFAULT_KEYWORD = 'TRIWIZARD';

export const MINI_PUZZLE_HINT_PENALTY_MS = 15000;

export const MAZE_PENALTIES = {
  light: 4000,
  standard: 5500,
  heavy: 7000,
  severe: 8500
} as const;

export type MazeDifficulty = 'tutorial' | 'opening' | 'pressure' | 'finale';

export const MAZE_DIFFICULTY_LABELS: Record<MazeDifficulty, string> = {
  tutorial: 'Tutorial Marker',
  opening: 'Opening Stretch',
  pressure: 'Pressure Stretch',
  finale: 'Final Stretch'
};
