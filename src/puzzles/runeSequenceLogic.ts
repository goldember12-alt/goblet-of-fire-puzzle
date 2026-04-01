import { RuneRule, RuneSequencePuzzle } from './runeSequencePuzzle';

export type Arrangement = Array<string | null>;

export type RuleEvaluation = {
  rule: RuneRule;
  satisfied: boolean;
};

const findPosition = (arrangement: Arrangement, fragmentId: string): number =>
  arrangement.findIndex((currentId) => currentId === fragmentId);

const evaluateRule = (rule: RuneRule, arrangement: Arrangement): boolean => {
  switch (rule.kind) {
    case 'immediatelyLeftOf': {
      const leftIndex = findPosition(arrangement, rule.leftId);
      const rightIndex = findPosition(arrangement, rule.rightId);
      return leftIndex >= 0 && rightIndex >= 0 && leftIndex + 1 === rightIndex;
    }
    case 'between': {
      const leftIndex = findPosition(arrangement, rule.leftId);
      const middleIndex = findPosition(arrangement, rule.middleId);
      const rightIndex = findPosition(arrangement, rule.rightId);
      return leftIndex >= 0 && middleIndex >= 0 && rightIndex >= 0 && leftIndex < middleIndex && middleIndex < rightIndex;
    }
    case 'notAdjacent': {
      const firstIndex = findPosition(arrangement, rule.firstId);
      const secondIndex = findPosition(arrangement, rule.secondId);
      return firstIndex >= 0 && secondIndex >= 0 && Math.abs(firstIndex - secondIndex) !== 1;
    }
  }
};

export const createEmptyArrangement = (slotCount: number): Arrangement =>
  Array.from({ length: slotCount }, () => null);

export const isArrangementComplete = (arrangement: Arrangement): boolean =>
  arrangement.every((fragmentId) => fragmentId !== null);

export const countCorrectPlacements = (
  puzzle: RuneSequencePuzzle,
  arrangement: Arrangement
): number =>
  arrangement.reduce((total, fragmentId, index) => {
    return total + (fragmentId !== null && fragmentId === puzzle.solutionOrder[index] ? 1 : 0);
  }, 0);

export const evaluateArrangement = (
  puzzle: RuneSequencePuzzle,
  arrangement: Arrangement
): RuleEvaluation[] => puzzle.rules.map((rule) => ({ rule, satisfied: evaluateRule(rule, arrangement) }));

export const isSolvedArrangement = (
  puzzle: RuneSequencePuzzle,
  arrangement: Arrangement
): boolean =>
  isArrangementComplete(arrangement) &&
  puzzle.solutionOrder.every((fragmentId, index) => arrangement[index] === fragmentId);

export const getFirstHintPlacement = (
  puzzle: RuneSequencePuzzle,
  arrangement: Arrangement
): { slotIndex: number; fragmentId: string } | null => {
  const slotIndex = arrangement.findIndex((fragmentId, index) => fragmentId !== puzzle.solutionOrder[index]);

  if (slotIndex === -1) {
    return null;
  }

  return {
    slotIndex,
    fragmentId: puzzle.solutionOrder[slotIndex]
  };
};
