let currentWordset: Wordset | null = null;
let currentWordGenerator: WordGenerator | null = null;

export class Wordset {
  public words: string[];
  public length: number;
  constructor(words: string[]) {
    this.words = words;
    this.length = this.words.length;
  }

  public randomWord(): string {
    return this.words[Math.floor(Math.random() * this.length)];
  }
}

const prefixSize = 2;

class CharDistribution {
  public chars: { [char: string]: number };
  public count: number;
  constructor() {
    this.chars = {};
    this.count = 0;
  }

  public addChar(char: string): void {
    this.count++;
    if (char in this.chars) {
      this.chars[char]++;
    } else {
      this.chars[char] = 1;
    }
  }

  public randomChar(): string {
    const randomIndex = Math.floor(Math.random() * this.count);
    let runningCount = 0;
    for (const [char, charCount] of Object.entries(this.chars)) {
      runningCount += charCount;
      if (runningCount > randomIndex) {
        return char;
      }
    }

    return Object.keys(this.chars)[0];
  }
}

class WordGenerator extends Wordset {
  public ngrams: { [prefix: string]: CharDistribution } = {};
  constructor(words: string[]) {
    super(words);
    // Can generate an unbounded number of words in theory.
    this.length = Infinity;

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

  public override randomWord(): string {
    let word = "";
    for (;;) {
      const prefix = word.substr(-prefixSize);
      const charDistribution = this.ngrams[prefix];
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

export function withWords(words: string[], funbox: string): Wordset {
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
