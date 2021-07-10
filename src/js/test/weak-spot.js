import * as TestStats from "./test-stats";

// Changes how quickly it 'learns' scores - very roughly the score for a char
// is based on last 1/adjustRate occurrences. Make it larger to adjust faster.
// Should be between 0 and 1.
const adjustRate = 0.02;

// Choose the highest scoring word from this many random words. Higher values
// will choose words with more weak letters on average.
const wordSamples = 20;

// The score that every character starts on. The ideal value would be the
// average spacing in milliseconds, but since we don't know that at the start,
// pick something little high and it'll converge as the user types.
const defaultScore = 500;

// Score penatly (in milliseconds) for getting a letter wrong.
const incorrectPenalty = 5000;

let scores = {};

export function updateScore(char, isCorrect) {
  let score = 0.0;
  const timings = TestStats.keypressTimings.spacing.array;
  if (timings.length > 0) {
    score += timings[timings.length - 1];
  }
  if (!isCorrect) {
    score += incorrectPenalty;
  }
  if (!(char in scores)) {
    scores[char] = defaultScore;
  }
  // Keep an exponential moving average of the score over time.
  scores[char] = score * adjustRate + scores[char] * (1 - adjustRate);
}

export function getWord(wordset) {
  let highScore;
  let randomWord;
  for (let i = 0; i < wordSamples; i++) {
    let newWord = wordset[Math.floor(Math.random() * wordset.length)];
    let newScore = score(newWord);
    if (i == 0 || newScore > highScore) {
      randomWord = newWord;
      highScore = newScore;
    }
  }
  return randomWord;
}

function score(word) {
  let total = 0.0;
  for (const c of word) {
    total += c in scores ? scores[c] : defaultScore;
  }
  return total / word.length;
}
