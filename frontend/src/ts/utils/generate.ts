import { randomIntFromRange } from "./numbers";
import * as Arrays from "./arrays";
import * as Strings from "./strings";

/**
 * Generates a random binary string of length 8.
 * @returns The generated binary string.
 */
export function getBinary(): string {
  const ret = Math.floor(Math.random() * 256).toString(2);
  return ret.padStart(8, "0");
}

/**
 * Generates a random hexadecimal string between 1 and 8 bytes.
 * @returns The generated hexadecimal string.
 */
export function getHexadecimal(): string {
  const randLen = randomIntFromRange(1, 4);
  return Array.from({ length: randLen }, () => {
    return Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0");
  }).join("");
}

/**
 * Converts a word to Morse code.
 * @param word The word to convert to Morse code.
 * @returns The Morse code representation of the word.
 */
export function getMorse(word: string): string {
  const morseCode: Record<string, string> = {
    a: ".-",
    b: "-...",
    c: "-.-.",
    d: "-..",
    e: ".",
    f: "..-.",
    g: "--.",
    h: "....",
    i: "..",
    j: ".---",
    k: "-.-",
    l: ".-..",
    m: "--",
    n: "-.",
    o: "---",
    p: ".--.",
    q: "--.-",
    r: ".-.",
    s: "...",
    t: "-",
    u: "..-",
    v: "...-",
    w: ".--",
    x: "-..-",
    y: "-.--",
    z: "--..",
    "0": "-----",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    ".": ".-.-.-",
    ",": "--..--",
    "?": "..--..",
    "'": ".----.",
    "/": "-..-.",
    "(": "-.--.",
    ")": "-.--.-",
    "&": ".-...",
    ":": "---...",
    ";": "-.-.-.",
    "=": "-...-",
    "+": ".-.-.",
    "-": "-....-",
    _: "..--.-",
    '"': ".-..-.",
    $: "...-..-",
    "!": "-.-.--",
    "@": ".--.-.",
  };

  let morseWord = "";

  const deAccentedWord = Strings.replaceSpecialChars(word);
  for (let i = 0; i < deAccentedWord.length; i++) {
    const letter = morseCode[deAccentedWord.toLowerCase()[i] as string];
    morseWord += letter !== undefined ? letter + "/" : "";
  }
  return morseWord;
}

/**
 * Generates a random gibberish string of lowercase letters.
 * @returns The generated gibberish string.
 */
export function getGibberish(): string {
  const randLen = randomIntFromRange(1, 7);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    ret += String.fromCharCode(97 + randomIntFromRange(0, 25));
  }
  return ret;
}

/**
 * Generates a random ASCII string of printable characters.
 * @returns The generated ASCII string.
 */
export function getASCII(): string {
  const randLen = randomIntFromRange(1, 10);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    const ran = 33 + randomIntFromRange(0, 93);
    ret += String.fromCharCode(ran);
  }
  return ret;
}

/**
 * Generates a random string of special characters.
 * @returns The generated string of special characters.
 */
export function getSpecials(): string {
  const randLen = randomIntFromRange(1, 7);
  let ret = "";
  const specials = [
    "`",
    "~",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "{",
    "}",
    "[",
    "]",
    "'",
    '"',
    "/",
    "\\",
    "|",
    "?",
    ";",
    ":",
    ">",
    "<",
  ];
  for (let i = 0; i < randLen; i++) {
    ret += Arrays.randomElementFromArray(specials);
  }
  return ret;
}

/**
 * Generates a random string of digits with a specified length.
 * @param len The length of the generated string.
 * @returns The generated string of digits.
 */
export function getNumbers(len: number): string {
  const randLen = randomIntFromRange(1, len);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    let randomNum;
    if (i === 0) {
      randomNum = randomIntFromRange(1, 9);
    } else {
      randomNum = randomIntFromRange(0, 9);
    }
    ret += randomNum.toString();
  }
  return ret;
}
