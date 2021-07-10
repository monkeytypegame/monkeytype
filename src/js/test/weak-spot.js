import * as TestStats from "./test-stats";

const adjustRate = 0.02;
const wordSamples = 20;

// TODO: base these on WPM or something instead of constants
const defaultScore = 500;
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
