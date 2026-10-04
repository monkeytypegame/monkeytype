import { KeySelectionError } from "./errors";
import { generateExercise } from "./generator";
import type { PracticeConfig } from "./types";

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Generate in bounded chunks. Repeating a test keeps its seed and word sequence.
export class DrillSequence {
  private chunks = new Map<number, string[]>();
  private config: PracticeConfig;
  private dictionary: string[];
  private seed: number;
  constructor(
    config: PracticeConfig,
    dictionary: string[],
    seed = Math.floor(Math.random() * 0xffffffff),
  ) {
    this.config = config;
    this.dictionary = dictionary;
    this.seed = seed;
  }

  tokenAt(index: number): string {
    const chunk = Math.floor(index / 100);
    let tokens = this.chunks.get(chunk);
    if (tokens === undefined) {
      tokens = generateExercise(
        { ...this.config, amount: 100 },
        this.dictionary,
        seededRandom(this.seed + chunk),
      ).tokens;
      if (tokens.length === 0) {
        throw new KeySelectionError(
          "No words match these keys. Choose drills, more keys, or another language.",
        );
      }
      this.chunks.set(chunk, tokens);
    }
    return tokens[index % 100] as string;
  }
}
