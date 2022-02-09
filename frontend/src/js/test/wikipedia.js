import * as Loader from "../elements/loader";
import Config from "../config";
import * as Misc from "../misc";

export class Section {
  constructor(title, author, words) {
    this.title = title;
    this.author = author;
    this.words = words;
  }
}

export async function getTLD(languageGroup) {
  // language group to tld
  switch (languageGroup.name) {
    case "english":
      return "en";

    case "spanish":
      return "es";

    case "french":
      return "fr";

    case "german":
      return "de";

    case "portuguese":
      return "pt";

    case "italian":
      return "it";

    case "dutch":
      return "nl";

    default:
      return "en";
  }
}

export async function getSection() {
  // console.log("Getting section");
  Loader.show();

  // get TLD for wikipedia according to language group
  let urlTLD = "en";
  let currentLanguageGroup = await Misc.findCurrentGroup(Config.language);
  urlTLD = await getTLD(currentLanguageGroup);

  const randomPostURL = `https://${urlTLD}.wikipedia.org/api/rest_v1/page/random/summary`;
  var sectionObj = {};
  var randomPostReq = await fetch(randomPostURL);
  var pageid = 0;

  if (randomPostReq.status == 200) {
    let postObj = await randomPostReq.json();
    sectionObj.title = postObj.title;
    sectionObj.author = postObj.author;
    pageid = postObj.pageid;
  }

  return new Promise((res, rej) => {
    if (randomPostReq.status != 200) {
      Loader.hide();
      rej(randomPostReq.status);
    }

    const sectionURL = `https://${urlTLD}.wikipedia.org/w/api.php?action=query&format=json&pageids=${pageid}&prop=extracts&exintro=true&origin=*`;

    var sectionReq = new XMLHttpRequest();
    sectionReq.onload = () => {
      if (sectionReq.readyState == 4) {
        if (sectionReq.status == 200) {
          let sectionText = JSON.parse(sectionReq.responseText).query.pages[
            pageid.toString()
          ].extract;
          let words = [];

          // Remove double whitespaces and finally trailing whitespaces.
          sectionText = sectionText.replace(/<\/p><p>+/g, " ");
          sectionText = $("<div/>").html(sectionText).text();

          sectionText = sectionText.replace(/\s+/g, " ");
          sectionText = sectionText.trim();

          // // Add spaces
          // sectionText = sectionText.replace(/[a-zA-Z0-9]{3,}\.[a-zA-Z]/g, (x) =>
          //   x.replace(/\./, ". ")
          // );

          sectionText.split(" ").forEach((word) => {
            words.push(word);
          });

          let section = new Section(sectionObj.title, sectionObj.author, words);
          Loader.hide();
          res(section);
        } else {
          Loader.hide();
          rej(sectionReq.status);
        }
      }
    };
    sectionReq.open("GET", sectionURL);
    sectionReq.send();
  });
}
