const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const isLetter = (character: string): boolean => /^[A-Z]$/.test(character);

const normalize = (value: string): string => value.toUpperCase();

export const getAlphabetIndex = (character: string): number => ALPHABET.indexOf(normalize(character));

export const getShiftFromKeyLetter = (character: string): number => getAlphabetIndex(character);

export const getKeyStream = (text: string, key: string): string => {
  const normalizedText = normalize(text);
  const normalizedKey = normalize(key).replace(/[^A-Z]/g, '');

  if (!normalizedKey) {
    return normalizedText;
  }

  let keyIndex = 0;

  return normalizedText
    .split('')
    .map((character) => {
      if (!isLetter(character)) {
        return character;
      }

      const nextCharacter = normalizedKey[keyIndex % normalizedKey.length];
      keyIndex += 1;
      return nextCharacter;
    })
    .join('');
};

const transformWithKey = (text: string, key: string, direction: 1 | -1): string => {
  const normalizedText = normalize(text);
  const keyStream = getKeyStream(normalizedText, key);

  return normalizedText
    .split('')
    .map((character, index) => {
      if (!isLetter(character)) {
        return character;
      }

      const textIndex = getAlphabetIndex(character);
      const shift = getShiftFromKeyLetter(keyStream[index]);
      const transformedIndex = (textIndex + direction * shift + 26) % 26;
      return ALPHABET[transformedIndex];
    })
    .join('');
};

export const encodeWithKey = (plainText: string, key: string): string =>
  transformWithKey(plainText, key, 1);

export const decodeWithKey = (cipherText: string, key: string): string =>
  transformWithKey(cipherText, key, -1);

export const cycleGuessLetter = (current: string): string => {
  if (current === '?') {
    return 'A';
  }

  const currentIndex = getAlphabetIndex(current);
  return currentIndex === ALPHABET.length - 1 ? '?' : ALPHABET[currentIndex + 1];
};

export const cycleGuessLetterBackward = (current: string): string => {
  if (current === '?') {
    return 'Z';
  }

  const currentIndex = getAlphabetIndex(current);
  return currentIndex === 0 ? '?' : ALPHABET[currentIndex - 1];
};
