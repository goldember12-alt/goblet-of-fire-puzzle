import {
  DEFAULT_KEYWORD,
  MAZE_DIFFICULTY_LABELS,
  MAZE_PENALTIES,
  type MazeDifficulty
} from './runConfig';
import { encodeWithKey } from '../puzzles/mazeCipher';

export type RouteSigil = {
  id: string;
  title: string;
  glyph: string;
};

export type MazeChoice = {
  id: string;
  label: string;
  commandWord: string;
  isCorrect: boolean;
  penaltyMs?: number;
  feedbackText: string;
  routeSigil: RouteSigil;
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

type RandomSource = () => number;

const ROUTE_SIGILS: RouteSigil[] = [
  { id: 'mist', title: 'Mist Rune', glyph: '≋' },
  { id: 'crown', title: 'Crown Rune', glyph: '♛' },
  { id: 'ember', title: 'Ember Rune', glyph: '✦' },
  { id: 'thorn', title: 'Thorn Rune', glyph: '✢' },
  { id: 'moon', title: 'Moon Rune', glyph: '☾' }
];

const checkpointSpecs: CheckpointSpec[] = [
  {
    id: 'thorn-gate',
    title: 'Checkpoint I: Thorn Gate',
    difficulty: 'tutorial',
    decodedCommand: 'LEFT',
    flavorText:
      'A hedge gate splits around a thorn-choked center. This first marker is short on purpose: read it cleanly, then trust the branch that opens on that side.',
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
  },
  {
    id: 'root-lattice',
    title: 'Checkpoint II: Root Lattice',
    difficulty: 'opening',
    decodedCommand: 'FORWARD',
    flavorText:
      'Twisted roots knot into a lattice junction with two tempting escapes and one true lane through the center.',
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
  },
  {
    id: 'moon-dial',
    title: 'Checkpoint III: Moon Dial',
    difficulty: 'opening',
    decodedCommand: 'NORTH',
    flavorText:
      'Three hedge corridors gather around a moon dial, but only the northern cut stays open once the glyphs finish turning.',
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
  },
  {
    id: 'lantern-fork',
    title: 'Checkpoint IV: Lantern Fork',
    difficulty: 'pressure',
    decodedCommand: 'EAST',
    flavorText:
      'Lanterns hang over a fork that looks wider than it is. One branch cuts east through the hedge wall while the others fold into traps.',
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
  },
  {
    id: 'briar-weir',
    title: 'Checkpoint V: Briar Weir',
    difficulty: 'pressure',
    decodedCommand: 'SOUTH',
    flavorText:
      'The weir narrows into a tight knot of hedges with only one southern breach before the thorns knit shut again.',
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
  },
  {
    id: 'cup-glow',
    title: 'Checkpoint VI: Cup Glow',
    difficulty: 'finale',
    decodedCommand: 'RIGHT',
    flavorText:
      'A distant cup-glow leaks through the final hedge chamber. One clean read reveals the last rightward break in the maze.',
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
  }
];

const encodeCheckpointCommand = (decodedCommand: string): string =>
  encodeWithKey(decodedCommand, DEFAULT_KEYWORD);

const shuffle = <T>(values: T[], random: RandomSource): T[] => {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
};

const createCheckpoint = (spec: CheckpointSpec, random: RandomSource): MazeCheckpoint => {
  const baseChoices = [
    {
      ...spec.correctChoice,
      commandWord: spec.decodedCommand,
      isCorrect: true
    },
    ...spec.wrongChoices.map((choice) => ({
      ...choice,
      isCorrect: false
    }))
  ];

  const sigils = shuffle(ROUTE_SIGILS, random).slice(0, baseChoices.length);
  const choices = shuffle(
    baseChoices.map((choice, index) => ({
      ...choice,
      routeSigil: sigils[index]
    })),
    random
  );

  return {
    id: spec.id,
    title: spec.title,
    difficulty: spec.difficulty,
    decodedCommand: spec.decodedCommand,
    ciphertext: encodeCheckpointCommand(spec.decodedCommand),
    flavorText: spec.flavorText,
    rewardLetter: spec.rewardLetter,
    choices
  };
};

export const buildMazeRunCheckpoints = (random: RandomSource = Math.random): MazeCheckpoint[] =>
  checkpointSpecs.map((spec) => createCheckpoint(spec, random));

export const getMazeDifficultyLabel = (difficulty: MazeDifficulty): string =>
  MAZE_DIFFICULTY_LABELS[difficulty];
