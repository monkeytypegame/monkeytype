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

const prefixSize = 3;

class Gibberish extends Wordset {
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
        prefix = prefix.substr(-prefixSize);
      }
    }
  }

  random() {
    let word = '';
    for (; ;) {
      let nextChoices = this.prefixes[word.substr(-prefixSize)];
      if (!nextChoices) {
        word = '';
        continue;
      }
      const nextChar = nextChoices[Math.floor(Math * nextChoices.length)];
      if (nextChar == ' ') {
        break;
      }
      word += nextChar;
    }
    return word;
  }
}

export function withWords(words, gibberish) {
  if (
    currentWordset == null ||
    words !== currentWordset.words ||
    gibberish != (currentWordset instanceof Gibberish)
  ) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}
