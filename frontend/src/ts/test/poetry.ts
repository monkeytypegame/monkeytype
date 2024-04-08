import axios from "axios";
import { Section } from "../utils/misc";

const bannedChars = ["—", "_", " "];
const maxWords = 100;
const apiURL = "https://poetrydb.org/random";

export class Poem extends Section {
  constructor(title: string, author: string, words: string[]) {
    super(title, author, words);
    this.title = title;
    this.author = author;
    this.words = words;

    this.cleanUpText();
  }

  cleanUpText(): void {
    let count = 0;
    const scrubbedWords = [];

    for (const word of this.words) {
      let scrubbed = "";
      for (const char of word) {
        if (!bannedChars.includes(char)) {
          scrubbed += char;
        }
      }

      if (scrubbed === "") continue;

      scrubbedWords.push(scrubbed);
      count++;

      if (count === maxWords) break;
    }

    this.words = scrubbedWords;
  }
}

type PoemObject = {
  lines: string[];
  title: string;
  author: string;
};

export async function getPoem(): Promise<Section | false> {
  console.log("Getting poem");

  try {
    const response = await axios.get(apiURL);
    const poemObj: PoemObject = response.data[0];

    const words: string[] = [];

    poemObj.lines.forEach((line) => {
      line.split(/ +/).forEach((word) => {
        words.push(word);
      });
    });

    return new Poem(poemObj.title, poemObj.author, words);
  } catch (e) {
    console.log(e);
    return false;
  }
}
