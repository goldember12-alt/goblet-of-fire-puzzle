import {
  DEFAULT_KEYWORD,
  MAZE_DIFFICULTY_LABELS,
  MAZE_PENALTIES,
  type MazeDifficulty
} from './runConfig';
import { encodeWithKey } from '../puzzles/mazeCipher';

export type MazeChoice = {
  id: string;
  label: string;
  commandWord: string;
  isCorrect: boolean;
  penaltyMs?: number;
  feedbackText: string;
};

export type MazeCheckpoint = {
  id: string;
  title: string;
  difficulty: MazeDifficulty;
  ciphertext: string;
  decodedCommand: string;
  flavorText: string;
  rewardLetter?: string;
  choices: MazeChoice[];
};

type ChoiceSpec = {
  id: string;
  label: string;
  commandWord: string;
  penaltyMs?: number;
  feedbackText: string;
};

type CheckpointSpec = {
  id: string;
  title: string;
  difficulty: MazeDifficulty;
  decodedCommand: string;
  flavorText: string;
  rewardLetter?: string;
  correctChoice: ChoiceSpec;
  wrongChoices: ChoiceSpec[];
};

const encodeCheckpointCommand = (decodedCommand: string): string =>
  encodeWithKey(decodedCommand, DEFAULT_KEYWORD);

const createCheckpoint = (spec: CheckpointSpec): MazeCheckpoint => ({
  id: spec.id,
  title: spec.title,
  difficulty: spec.difficulty,
  decodedCommand: spec.decodedCommand,
  ciphertext: encodeCheckpointCommand(spec.decodedCommand),
  flavorText: spec.flavorText,
  rewardLetter: spec.rewardLetter,
  choices: [
    {
      ...spec.correctChoice,
      commandWord: spec.decodedCommand,
      isCorrect: true
    },
    ...spec.wrongChoices.map((choice) => ({
      ...choice,
      isCorrect: false
    }))
  ]
});

export const mazeCheckpoints: MazeCheckpoint[] = [
  createCheckpoint({
    id: 'thorn-gate',
    title: 'Checkpoint I: Thorn Gate',
    difficulty: 'tutorial',
    decodedCommand: 'LEFT',
    flavorText:
      'The first marker glows through the hedge mist. It is short on purpose: one clean decode teaches the rhythm before the maze starts pressing back.',
    correctChoice: {
      id: 'left-arch',
      label: 'Briar Arch',
      commandWord: 'LEFT',
      feedbackText: 'The hedge parts and a pale lantern flares deeper in the maze.'
    },
    wrongChoices: [
      {
        id: 'forward-corridor',
        label: 'Root Corridor',
        commandWord: 'FORWARD',
        penaltyMs: MAZE_PENALTIES.standard,
        feedbackText: 'The corridor dead-ends in brambles and costs you valuable seconds.'
      },
      {
        id: 'right-turn',
        label: 'Lantern Bend',
        commandWord: 'RIGHT',
        penaltyMs: MAZE_PENALTIES.light,
        feedbackText: 'A false passage loops you back toward the checkpoint.'
      }
    ]
  }),
  createCheckpoint({
    id: 'root-lattice',
    title: 'Checkpoint II: Root Lattice',
    difficulty: 'opening',
    decodedCommand: 'FORWARD',
    flavorText:
      'Thick roots brace a narrow lattice bridge. The marker is longer than the first, but still meant to reward steady, straightforward decoding.',
    correctChoice: {
      id: 'forward-lattice',
      label: 'Lattice Span',
      commandWord: 'FORWARD',
      feedbackText: 'You keep momentum as the lattice settles beneath your stride.'
    },
    wrongChoices: [
      {
        id: 'left-hollow',
        label: 'Hollow Niche',
        commandWord: 'LEFT',
        penaltyMs: MAZE_PENALTIES.standard,
        feedbackText: 'The hollow fills with roots and forces a retreat to the marker.'
      },
      {
        id: 'right-bank',
        label: 'Slick Bank',
        commandWord: 'RIGHT',
        penaltyMs: MAZE_PENALTIES.standard,
        feedbackText: 'A slick bank crumbles underfoot and leaves you scrambling back.'
      }
    ]
  }),
  createCheckpoint({
    id: 'moon-dial',
    title: 'Checkpoint III: Moon Dial',
    difficulty: 'opening',
    decodedCommand: 'NORTH',
    flavorText:
      'A moonlit dial hums with cold glyphs. By now the keyword should feel familiar, but the route words are no longer all directional habits from the first lesson.',
    correctChoice: {
      id: 'north-steps',
      label: 'Moon Steps',
      commandWord: 'NORTH',
      feedbackText: 'The dial swings open and the northern steps carry you into clearer air.'
    },
    wrongChoices: [
      {
        id: 'east-rim',
        label: 'Silver Rim',
        commandWord: 'EAST',
        penaltyMs: MAZE_PENALTIES.heavy,
        feedbackText: 'A rim of ivy lashes shut and sends you back to the dial.'
      },
      {
        id: 'south-arches',
        label: 'Arch Hollow',
        commandWord: 'SOUTH',
        penaltyMs: MAZE_PENALTIES.standard,
        feedbackText: 'The arches circle you into a dead hedge pocket.'
      }
    ]
  }),
  createCheckpoint({
    id: 'lantern-fork',
    title: 'Checkpoint IV: Lantern Fork',
    difficulty: 'pressure',
    decodedCommand: 'EAST',
    flavorText:
      'Floating lanterns mark a fork that looks more trustworthy than it is. The safe route is still readable, but hesitation now costs more.',
    correctChoice: {
      id: 'east-lanterns',
      label: 'Lantern Chain',
      commandWord: 'EAST',
      feedbackText: 'The lanterns slide aside and give you a brief, precious burst of speed.'
    },
    wrongChoices: [
      {
        id: 'north-gap',
        label: 'Gap Breach',
        commandWord: 'NORTH',
        penaltyMs: MAZE_PENALTIES.heavy,
        feedbackText: 'The gap seals behind you and wastes a long recovery.'
      },
      {
        id: 'west-vines',
        label: 'Vine Tunnel',
        commandWord: 'WEST',
        penaltyMs: MAZE_PENALTIES.standard,
        feedbackText: 'The vines drag you into a loop and spit you back at the fork.'
      }
    ]
  }),
  createCheckpoint({
    id: 'briar-weir',
    title: 'Checkpoint V: Briar Weir',
    difficulty: 'pressure',
    decodedCommand: 'SOUTH',
    flavorText:
      'The hedges narrow into a briar weir where every wrong angle bites back. The clue is fair, but the recovery paths are no longer gentle.',
    correctChoice: {
      id: 'south-breach',
      label: 'Thorn Breach',
      commandWord: 'SOUTH',
      feedbackText: 'You find the only gap before the thorns can knit shut.'
    },
    wrongChoices: [
      {
        id: 'east-thorns',
        label: 'Thorn Wall',
        commandWord: 'EAST',
        penaltyMs: MAZE_PENALTIES.severe,
        feedbackText: 'The thorns close around you and exact a brutal delay.'
      },
      {
        id: 'north-wall',
        label: 'Stone Return',
        commandWord: 'NORTH',
        penaltyMs: MAZE_PENALTIES.heavy,
        feedbackText: 'A hedge wall collapses into your path and forces a costly retreat.'
      }
    ]
  }),
  createCheckpoint({
    id: 'cup-glow',
    title: 'Checkpoint VI: Cup Glow',
    difficulty: 'finale',
    decodedCommand: 'RIGHT',
    flavorText:
      'A distant gold light leaks through the last corridor. The final marker is short again, but now the pressure comes from knowing one clean read will end the run.',
    rewardLetter: 'C',
    correctChoice: {
      id: 'right-final',
      label: 'Cup Glow',
      commandWord: 'RIGHT',
      feedbackText: 'The final hedge curls back and the Cup comes into view.'
    },
    wrongChoices: [
      {
        id: 'left-detour',
        label: 'Thorn Ring',
        commandWord: 'LEFT',
        penaltyMs: MAZE_PENALTIES.severe,
        feedbackText: 'The detour collapses into a thorn circle and wastes precious time.'
      },
      {
        id: 'forward-listen',
        label: 'Murk Channel',
        commandWord: 'FORWARD',
        penaltyMs: MAZE_PENALTIES.heavy,
        feedbackText: 'The murk thickens into a false corridor and forces you back.'
      }
    ]
  })
];

export const getMazeDifficultyLabel = (difficulty: MazeDifficulty): string =>
  MAZE_DIFFICULTY_LABELS[difficulty];
