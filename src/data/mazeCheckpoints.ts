export type MazeChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
  penaltyMs?: number;
  feedbackText: string;
};

export type MazeCheckpoint = {
  id: string;
  title: string;
  ciphertext: string;
  decodedCommand: string;
  flavorText: string;
  rewardLetter?: string;
  choices: MazeChoice[];
};

export const mazeCheckpoints: MazeCheckpoint[] = [
  {
    id: 'thorn-gate',
    title: 'Checkpoint I: Thorn Gate',
    ciphertext: 'XSVR',
    decodedCommand: 'LEFT',
    flavorText:
      'The first marker glows through the hedge mist. Its meaning stays dormant until the recovered key is used to attune the stone.',
    choices: [
      {
        id: 'left-arch',
        label: 'Take the Left Arch',
        isCorrect: true,
        feedbackText: 'The hedge parts and a pale lantern flares deeper in the maze.'
      },
      {
        id: 'forward-corridor',
        label: 'Force the Forward Corridor',
        isCorrect: false,
        penaltyMs: 7000,
        feedbackText: 'The corridor dead-ends in brambles and costs you valuable seconds.'
      },
      {
        id: 'right-turn',
        label: 'Slip into the Right Turn',
        isCorrect: false,
        penaltyMs: 5000,
        feedbackText: 'A false passage loops you back toward the checkpoint.'
      }
    ]
  },
  {
    id: 'moon-dial',
    title: 'Checkpoint II: Moon Dial',
    ciphertext: 'NQJYM',
    decodedCommand: 'FORWARD',
    flavorText:
      'A stone dial hums with moonlit glyphs. The attuned key now opens a provisional reading while the full cipher layer is still being built.',
    choices: [
      {
        id: 'forward-bridge',
        label: 'Advance Through the Central Gap',
        isCorrect: true,
        feedbackText: 'You keep momentum as the hedges sway open ahead.'
      },
      {
        id: 'left-stairs',
        label: 'Follow the Left Stair of Roots',
        isCorrect: false,
        penaltyMs: 6000,
        feedbackText: 'Roots snag your boots and force a retreat to the marker.'
      },
      {
        id: 'right-gap',
        label: 'Cut Right by the Sundial Wall',
        isCorrect: false,
        penaltyMs: 8000,
        feedbackText: 'A hedge wall slams shut and blocks the route.'
      }
    ]
  },
  {
    id: 'cup-glow',
    title: 'Checkpoint III: Cup Glow',
    ciphertext: 'YJXY',
    decodedCommand: 'RIGHT',
    flavorText:
      'A distant gold light marks the final corridor. The marker can be interpreted only after the egg has yielded the maze key.',
    rewardLetter: 'C',
    choices: [
      {
        id: 'right-final',
        label: 'Break Right Toward the Glow',
        isCorrect: true,
        feedbackText: 'The final hedge curls back and the Cup comes into view.'
      },
      {
        id: 'left-detour',
        label: 'Probe the Left Detour',
        isCorrect: false,
        penaltyMs: 9000,
        feedbackText: 'The detour collapses into a thorn circle and wastes time.'
      },
      {
        id: 'wait-listen',
        label: 'Wait and Listen for Movement',
        isCorrect: false,
        penaltyMs: 4000,
        feedbackText: 'Hesitation lets the magic shift the route around you.'
      }
    ]
  }
];
