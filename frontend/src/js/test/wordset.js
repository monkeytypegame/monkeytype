let currentWordset = null;
let currentWordGenerator = null;

class Wordset {
  constructor(words) {
    this.words = words;
    this.length = this.words.length;
  }

  randomWord() {
    return this.words[Math.floor(Math.random() * this.length)];
  }
}

const prefixSize = 2;

class CharDistribution {
  constructor() {
    this.chars = {};
    this.count = 0;
  }

  addChar(char) {
    this.count++;
    if (char in this.chars) {
      this.chars[char]++;
    } else {
      this.chars[char] = 1;
    }
  }

  randomChar() {
    const randomIndex = Math.floor(Math.random() * this.count);
    let runningCount = 0;
    for (const [char, charCount] of Object.entries(this.chars)) {
      runningCount += charCount;
      if (runningCount > randomIndex) {
        return char;
      }
    }
  }
}

class WordGenerator extends Wordset {
  constructor(words) {
    super(words);
    // Can generate an unbounded number of words in theory.
    this.length = Infinity;

    this.ngrams = {};
    for (let word of words) {
      // Mark the end of each word with a space.
      word += " ";
      let prefix = "";
      for (const c of word) {
        // Add `c` to the distribution of chars that can come after `prefix`.
        if (!(prefix in this.ngrams)) {
          this.ngrams[prefix] = new CharDistribution();
        }
        this.ngrams[prefix].addChar(c);
        prefix = (prefix + c).substr(-prefixSize);
      }
    }
  }

  randomWord() {
    let word = "";
    for (;;) {
      const prefix = word.substr(-prefixSize);
      let charDistribution = this.ngrams[prefix];
      if (!charDistribution) {
        // This shouldn't happen if this.ngrams is complete. If it does
        // somehow, start generating a new word.
        word = "";
        continue;
      }
      // Pick a random char from the distribution that comes after `prefix`.
      const nextChar = charDistribution.randomChar();
      if (nextChar == " ") {
        // A space marks the end of the word, so stop generating and return.
        break;
      }
      word += nextChar;
    }
    return word;
  }
}

export function withWords(words, funbox) {
  if (funbox == "pseudolang") {
    if (currentWordGenerator == null || words !== currentWordGenerator.words) {
      currentWordGenerator = new WordGenerator(words);
    }
    return currentWordGenerator;
  } else {
    if (currentWordset == null || words !== currentWordset.words) {
      currentWordset = new Wordset(words);
    }
    return currentWordset;
  }
}
