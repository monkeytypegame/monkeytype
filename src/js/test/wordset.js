let currentWordset = null;

export function withWords(words) {
  if (currentWordset == null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}

export class Wordset {
  constructor(words) {
    this.words = words;
    this.length = this.words.length;
  }

  random() {
    return this.words[Math.floor(Math.random() * this.length)];
  }
}