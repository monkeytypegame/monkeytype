const bannedChars = ["—", "_", " "];
const maxWords = 100;
const apiURL = "https://poetrydb.org/random";

export class Poem {
  constructor(title, author, words) {
    this.title = title;
    this.author = author;
    this.words = words;

    this.cleanUpText();
  }

  cleanUpText() {
    var count = 0;
    var scrubbedWords = [];
    for (var i = 0; i < this.words.length; i++) {
      let scrubbed = "";
      for (var j = 0; j < this.words[i].length; j++) {
        if (!bannedChars.includes(this.words[i][j]))
          scrubbed += this.words[i][j];
      }

      if (scrubbed == "") continue;

      scrubbedWords.push(scrubbed);
      count++;

      if (count == maxWords) break;
    }

    this.words = scrubbedWords;
  }
}

export async function getPoem() {
  return new Promise((res, rej) => {
    console.log("Getting poem");
    var poemReq = new XMLHttpRequest();
    poemReq.onload = () => {
      if (poemReq.readyState == 4) {
        if (poemReq.status == 200) {
          let poemObj = JSON.parse(poemReq.responseText)[0];
          let words = [];
          poemObj.lines.forEach((line) => {
            line.split(" ").forEach((word) => {
              words.push(word);
            });
          });

          let poem = new Poem(poemObj.title, poemObj.author, words);
          res(poem);
        } else {
          rej(poemReq.status);
        }
      }
    };
    poemReq.open("GET", apiURL);
    poemReq.send();
  });
}
