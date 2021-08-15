import Config from "./config";

let currentWordset = null;
let currentWordGenerator = null;

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

class CharDistribution {
  constructor() {
    this.chars = {};
    this.count = 0;
  }

  add(char) {
    this.count++;
    if (char in this.chars) {
      this.chars[char]++;
    } else {
      this.chars[char] = 1;
    }
  }

  random() {
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
    this.length = Infinity;

    this.ngrams = {};
    for (let word of words) {
      word += " ";
      let prefix = "";
      for (const c of word) {
        if (!(prefix in this.ngrams)) {
          this.ngrams[prefix] = new CharDistribution();
        }
        this.ngrams[prefix].add(c);
        prefix = (prefix + c).substr(-prefixSize);
      }
    }
  }

  random() {
    let word = "";
    for (; ;) {
      const prefix = word.substr(-prefixSize);
      let charDistribution = this.ngrams[prefix];
      if (!charDistribution) {
        word = "";
        continue;
      }
      const nextChar = charDistribution.random();
      if (nextChar == " ") {
        break;
      }
      word += nextChar;
    }
    return word;
  }
}

export function withWords(words) {
  if (Config.funbox == "jabberwocky") {
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
