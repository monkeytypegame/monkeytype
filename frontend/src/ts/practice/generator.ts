import { Exercise, PracticeConfig, practiceConfigSchema } from "./types";

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

export function validateTokens(
  tokens: string[],
  characters: string[],
): boolean {
  const allowed = new Set(characters);
  return (
    tokens.length > 0 &&
    tokens.every(
      (token) =>
        token.length > 0 &&
        Array.from(token).every((char) => allowed.has(char)),
    )
  );
}

export function generateExercise(
  config: PracticeConfig,
  words: string[] = [],
  random: () => number = Math.random,
): Exercise {
  practiceConfigSchema.parse(config);
  const characters = [...new Set(config.characters)];
  if (characters.length === 0) {
    throw new Error("Select at least one character to begin.");
  }
  const count = config.amount;
  const tokens: string[] = [];
  let matchingWords: number | null = null;
  if (config.style === "words") {
    const allowed = new Set(characters);
    const matching = [...new Set(words)].filter(
      (word) =>
        word.length >= config.minLength &&
        word.length <= config.maxLength &&
        Array.from(word).every((char) => allowed.has(char)),
    );
    matchingWords = matching.length;
    if (matching.length === 0) {
      return { tokens: [], matchingWords, missingCharacters: characters };
    }
    let bag: string[] = [];
    while (tokens.length < count) {
      if (bag.length === 0) bag = shuffled(matching, random);
      if (bag.length > 1 && bag[bag.length - 1] === tokens[tokens.length - 1]) {
        [bag[0], bag[bag.length - 1]] = [
          bag[bag.length - 1] as string,
          bag[0] as string,
        ];
      }
      tokens.push(bag.pop() as string);
    }
  } else {
    let bag: string[] = [];
    let previous = "";
    const nextCharacter = (): string => {
      if (bag.length === 0) bag = shuffled(characters, random);
      if (bag.length > 1 && bag[bag.length - 1] === previous) {
        [bag[0], bag[bag.length - 1]] = [
          bag[bag.length - 1] as string,
          bag[0] as string,
        ];
      }
      previous = bag.pop() as string;
      return previous;
    };
    for (let i = 0; i < count; i++) {
      const length =
        config.minLength +
        Math.floor(random() * (config.maxLength - config.minLength + 1));
      let token = "";
      if (config.style === "patterns") {
        const pattern = Array.from({ length: 1 + (i % 3) }, nextCharacter);
        token = Array.from(
          { length },
          (_, index) => pattern[index % pattern.length],
        ).join("");
      } else {
        token = Array.from({ length }, nextCharacter).join("");
      }
      tokens.push(token);
    }
  }
  if (!validateTokens(tokens, characters)) {
    throw new Error("Exercise contains characters outside your selection.");
  }
  const covered = new Set(tokens.join(""));
  return {
    tokens,
    matchingWords,
    missingCharacters: characters.filter((char) => !covered.has(char)),
  };
}
