export class Wordset {
  constructor(words) {
    this.words = words;
    this.length = this.words.length;
  }

  random() {
    return this.words[Math.floor(Math.random() * this.length)];
  }
}