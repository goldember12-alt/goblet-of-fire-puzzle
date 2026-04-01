export const SCENE_KEYS = {
  BOOT: 'boot',
  TITLE: 'title',
  INTRO: 'intro',
  MINI_PUZZLE: 'mini-puzzle',
  MAZE: 'maze',
  RESULTS: 'results'
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
