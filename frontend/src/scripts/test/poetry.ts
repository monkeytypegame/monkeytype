import axios from "axios";

const bannedChars = ["—", "_", " "];
const maxWords = 100;
const apiURL = "https://poetrydb.org/random";

export class Poem {
  public title: string;
  public author: string;
  public words: string[];
  constructor(title: string, author: string, words: string[]) {
    this.title = title;
    this.author = author;
    this.words = words;

    this.cleanUpText();
  }

  cleanUpText(): void {
    let count = 0;
    const scrubbedWords = [];
    for (let i = 0; i < this.words.length; i++) {
      let scrubbed = "";
      for (let j = 0; j < this.words[i].length; j++) {
        if (!bannedChars.includes(this.words[i][j])) {
          scrubbed += this.words[i][j];
        }
      }

      if (scrubbed == "") continue;

      scrubbedWords.push(scrubbed);
      count++;

      if (count == maxWords) break;
    }

    this.words = scrubbedWords;
  }
}

interface PoemObject {
  lines: string[];
  title: string;
  author: string;
}

export async function getPoem(): Promise<Poem | undefined> {
  console.log("Getting poem");

  const response = await axios.get(apiURL);

  try {
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
  }

  return;
}
