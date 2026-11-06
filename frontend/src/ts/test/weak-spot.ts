import {
  getLiveCachedInputPair,
  getLiveCachedMsSinceLastInputEvent,
} from "./events/live-cache";
import { Wordset } from "./wordset";

// Changes how quickly it 'learns' scores - very roughly the score for a bigram
// is based on last perBigramCount occurrences. Make it smaller to adjust faster.
const perBigramCount = 50;

// Choose the highest scoring word from this many random words. Higher values
// will choose words with more weak bigrams on average.
const wordSamples = 20;

// Score penalty (in milliseconds) for getting the second letter wrong.
const incorrectPenalty = 5000;

const scores: Record<string, Score> = {};

class Score {
  public average: number;
  public count: number;
  constructor() {
    this.average = 0.0;
    this.count = 0;
  }

  update(score: number): void {
    if (this.count < perBigramCount) {
      this.count++;
    }
    const adjustRate = 1.0 / this.count;
    // Keep an exponential moving average of the score over time.
    this.average = score * adjustRate + this.average * (1 - adjustRate);
  }
}

export function updateScore(word: string): void {
  const [previous, current] = getLiveCachedInputPair();
  const spacing = getLiveCachedMsSinceLastInputEvent();
  if (previous === null || current === null || spacing === null) {
    return;
  }

  const before = previous.data;
  const after = current.data;
  // Only consecutive, manually typed characters in the same word have a
  // meaningful transition time. Deletions and corrections break the pair.
  if (
    before.inputType !== "insertText" ||
    after.inputType !== "insertText" ||
    before.automatic ||
    after.automatic ||
    before.isCompositionEnding ||
    after.isCompositionEnding ||
    !before.correct ||
    before.inputStopped ||
    before.commitsWord ||
    before.wordIndex !== after.wordIndex ||
    before.charIndex + before.data.length !== after.charIndex ||
    [...before.data].length !== 1 ||
    [...after.data].length !== 1 ||
    /\s/u.test(before.data + after.data)
  ) {
    return;
  }

  const char = [...word.slice(after.charIndex)][0];
  if (char === undefined || /\s/u.test(char)) return;
  // Penalize the intended pair, not the typo (e.g. th, not tx).
  const bigram = before.data + char;
  let score = spacing;
  if (!after.correct) {
    score += incorrectPenalty;
  }
  if (!(bigram in scores)) {
    scores[bigram] = new Score();
  }
  scores[bigram]?.update(score);
}

function score(word: string): number {
  let total = 0.0;
  let numBigrams = 0;
  const chars = [...word];
  for (let i = 1; i < chars.length; i++) {
    const bigram = (chars[i - 1] as string) + (chars[i] as string);
    if (bigram in scores) {
      total += (scores[bigram] as Score).average;
      numBigrams++;
    }
  }
  return numBigrams === 0 ? 0.0 : total / numBigrams;
}

export function getWord(wordset: Wordset): string {
  let highScore;
  let randomWord = "";
  for (let i = 0; i < wordSamples; i++) {
    const newWord = wordset.randomWord("normal");
    const newScore = score(newWord);
    if (i === 0 || highScore === undefined || newScore > highScore) {
      randomWord = newWord;
      highScore = newScore;
    }
  }
  return randomWord;
}
