export type RuneFragment = {
  id: string;
  label: string;
  sigil: string;
  lore: string;
};

export type RuneRule =
  | {
      id: string;
      description: string;
      kind: 'immediatelyLeftOf';
      leftId: string;
      rightId: string;
    }
  | {
      id: string;
      description: string;
      kind: 'between';
      leftId: string;
      middleId: string;
      rightId: string;
    }
  | {
      id: string;
      description: string;
      kind: 'notAdjacent';
      firstId: string;
      secondId: string;
    };

export type RuneSequencePuzzle = {
  id: string;
  title: string;
  artifactName: string;
  objective: string;
  interactionHint: string;
  keyWord: string;
  hintPenaltyMs: number;
  fragments: RuneFragment[];
  rules: RuneRule[];
  solutionOrder: string[];
};

export const runeSequencePuzzle: RuneSequencePuzzle = {
  id: 'golden-egg-sequence',
  title: 'Golden Egg Sequence',
  artifactName: 'Runed Egg',
  objective:
    'Seat the five rune fragments from left to right so every omen card is true. When the sequence aligns, the egg will release the maze key.',
  interactionHint:
    'Click a rune fragment to select it, then place it on a pedestal. Click a filled pedestal with no fragment selected to clear it.',
  keyWord: 'TRIWIZARD',
  hintPenaltyMs: 15000,
  fragments: [
    {
      id: 'mist',
      label: 'Mist Rune',
      sigil: 'MI',
      lore: 'Veils the chamber in silver haze.'
    },
    {
      id: 'crown',
      label: 'Crown Rune',
      sigil: 'CR',
      lore: 'Marks the path of command.'
    },
    {
      id: 'ember',
      label: 'Ember Rune',
      sigil: 'EM',
      lore: 'Glows with stored heat.'
    },
    {
      id: 'thorn',
      label: 'Thorn Rune',
      sigil: 'TH',
      lore: 'Fastens wards into place.'
    },
    {
      id: 'moon',
      label: 'Moon Rune',
      sigil: 'MO',
      lore: 'Reflects the final gleam.'
    }
  ],
  rules: [
    {
      id: 'ember-thorn',
      description: 'Ember must stand immediately left of Thorn.',
      kind: 'immediatelyLeftOf',
      leftId: 'ember',
      rightId: 'thorn'
    },
    {
      id: 'thorn-moon',
      description: 'Thorn must stand immediately left of Moon.',
      kind: 'immediatelyLeftOf',
      leftId: 'thorn',
      rightId: 'moon'
    },
    {
      id: 'crown-between',
      description: 'Crown must stand somewhere between Mist and Ember.',
      kind: 'between',
      leftId: 'mist',
      middleId: 'crown',
      rightId: 'ember'
    },
    {
      id: 'mist-thorn',
      description: 'Mist cannot touch Thorn.',
      kind: 'notAdjacent',
      firstId: 'mist',
      secondId: 'thorn'
    }
  ],
  solutionOrder: ['mist', 'crown', 'ember', 'thorn', 'moon']
};
