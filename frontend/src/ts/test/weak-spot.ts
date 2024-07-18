import * as TestInput from "./test-input";
import { Wordset } from "./wordset";

// Changes how quickly it 'learns' scores - very roughly the score for a char
// is based on last perCharCount occurrences. Make it smaller to adjust faster.
const perCharCount = 50;

// Choose the highest scoring word from this many random words. Higher values
// will choose words with more weak letters on average.
const wordSamples = 20;

// Score penatly (in milliseconds) for getting a letter wrong.
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
    if (this.count < perCharCount) {
      this.count++;
    }
    const adjustRate = 1.0 / this.count;
    // Keep an exponential moving average of the score over time.
    this.average = score * adjustRate + this.average * (1 - adjustRate);
  }
}

export function updateScore(char: string, isCorrect: boolean): void {
  const timings = TestInput.keypressTimings.spacing.array;
  if (timings.length === 0 || typeof timings === "string") {
    return;
  }
  let score = timings[timings.length - 1] as number;
  if (!isCorrect) {
    score += incorrectPenalty;
  }
  if (!(char in scores)) {
    scores[char] = new Score();
  }
  scores[char]?.update(score);
}

function score(word: string): number {
  let total = 0.0;
  let numChars = 0;
  for (const c of word) {
    if (c in scores) {
      total += (scores[c] as Score).average;
      numChars++;
    }
  }
  return numChars === 0 ? 0.0 : total / numChars;
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
