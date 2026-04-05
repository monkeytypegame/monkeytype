import { isValidSurfaceForm } from "./surface-forms";

export type OracleState = {
  partialWord: string;
};

export type ConstraintOracle = {
  initialState: OracleState;
  canTerminate(state: OracleState): boolean;
  getNextState(state: OracleState, tokenText: string): OracleState | null;
};

export function createConstraintOracle(words: string[]): ConstraintOracle {
  const normalizedWords = normalizeAndValidateWords(words);
  const wordSet = new Set(normalizedWords);
  const prefixSet = new Set<string>();

  for (const word of normalizedWords) {
    for (let length = 1; length <= word.length; length++) {
      prefixSet.add(word.slice(0, length));
    }
  }

  return {
    initialState: { partialWord: "" },
    canTerminate(state) {
      return wordSet.has(state.partialWord);
    },
    getNextState(state, tokenText) {
      if (tokenText.length === 0) {
        return null;
      }

      let partialWord = state.partialWord;

      for (const char of tokenText) {
        if (char === " ") {
          if (!wordSet.has(partialWord)) {
            return null;
          }

          partialWord = "";
          continue;
        }

        partialWord += char;

        if (!prefixSet.has(partialWord)) {
          return null;
        }
      }

      return { partialWord };
    },
  };
}

export function enumerateOracleStates(words: string[]): OracleState[] {
  const normalizedWords = normalizeAndValidateWords(words);
  const states = new Set<string>([""]);

  for (const word of normalizedWords) {
    for (let length = 1; length <= word.length; length++) {
      states.add(word.slice(0, length));
    }
  }

  return Array.from(states).map((partialWord) => ({ partialWord }));
}

function normalizeAndValidateWords(words: string[]): string[] {
  if (words.length === 0) {
    throw new Error("Constraint oracle requires at least one word");
  }

  return words.map((word) => {
    const normalizedWord = word.normalize("NFC");

    if (!isValidSurfaceForm(normalizedWord)) {
      throw new Error(`invalid oracle word: ${word}`);
    }

    return normalizedWord;
  });
}
