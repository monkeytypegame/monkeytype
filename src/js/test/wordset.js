let currentWordset = null;

class Wordset {
  constructor(words) {
    this.words = words;
    this.length = this.words.length;
  }

  random() {
    return this.words[Math.floor(Math.random() * this.length)];
  }
}

const prefixSize = 2;

class WordGenerator extends Wordset {
  constructor(words) {
    super(words);
    this.length = Infinity;

    this.prefixes = {};
    for (let word of words) {
      word += ' ';
      let prefix = '';
      for (const c of word) {
        if (!(prefix in this.prefixes)) {
          this.prefixes[prefix] = [];
        }
        this.prefixes[prefix].push(c);
        prefix = (prefix + c).substr(-prefixSize);
      }
    }
  }

  random() {
    let word = '';
    for (; ;) {
      const prefix = word.substr(-prefixSize);
      let nextChoices = this.prefixes[prefix];
      if (!nextChoices) {
        word = '';
        continue;
      }
      const nextChar = nextChoices[Math.floor(Math.random() * nextChoices.length)];
      if (nextChar == ' ') {
        break;
      }
      word += nextChar;
    }
    return word;
  }
}

export function useWords(words) {
  if (
    currentWordset == null ||
    words !== currentWordset.words ||
    currentWordset instanceof WordGenerator
  ) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}

export function generateWordsFrom(words) {
  if (
    currentWordset == null ||
    words !== currentWordset.words ||
    !(currentWordset instanceof WordGenerator)
  ) {
    currentWordset = new WordGenerator(words);
  }
  return currentWordset;
}
