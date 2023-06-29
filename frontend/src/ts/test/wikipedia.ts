import * as Loader from "../elements/loader";
import * as Misc from "../utils/misc";
import { Section } from "../utils/misc";

export async function getTLD(
  languageGroup: MonkeyTypes.LanguageGroup
): Promise<"en" | "es" | "fr" | "de" | "pt" | "it" | "nl"> {
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

interface Post {
  title: string;
  author: string;
  pageid: number;
}

interface SectionObject {
  title: string;
  author: string;
}

export async function getSection(language: string): Promise<Section> {
  // console.log("Getting section");
  Loader.show();

  // get TLD for wikipedia according to language group
  let urlTLD = "en";

  let currentLanguageGroup;
  try {
    currentLanguageGroup = await Misc.findCurrentGroup(language);
  } catch (e) {
    console.error(
      Misc.createErrorMessage(e, "Failed to find current language group")
    );
  }

  if (currentLanguageGroup !== undefined) {
    urlTLD = await getTLD(currentLanguageGroup);
  }

  const randomPostURL = `https://${urlTLD}.wikipedia.org/api/rest_v1/page/random/summary`;
  const sectionObj: SectionObject = { title: "", author: "" };
  const randomPostReq = await fetch(randomPostURL);
  let pageid = 0;

  if (randomPostReq.status === 200) {
    const postObj: Post = await randomPostReq.json();
    sectionObj.title = postObj.title;
    sectionObj.author = postObj.author;
    pageid = postObj.pageid;
  }

  return new Promise((res, rej) => {
    if (randomPostReq.status !== 200) {
      Loader.hide();
      rej(randomPostReq.status);
    }

    const sectionURL = `https://${urlTLD}.wikipedia.org/w/api.php?action=query&format=json&pageids=${pageid}&prop=extracts&exintro=true&origin=*`;

    const sectionReq = new XMLHttpRequest();
    sectionReq.onload = (): void => {
      if (sectionReq.readyState === 4) {
        if (sectionReq.status === 200) {
          let sectionText: string = JSON.parse(sectionReq.responseText).query
            .pages[pageid.toString()].extract;

          // Converting to one paragraph
          sectionText = sectionText.replace(/<\/p><p>+/g, " ");

          // Convert HTML to text
          sectionText = Misc.htmlToText(sectionText);

          // Remove reference links
          sectionText = sectionText.replace(/\[\d+\]/gi, "");

          // Remove invisible characters
          sectionText = sectionText.replace(/[\u200B-\u200D\uFEFF]/g, "");

          // Convert all whitespace to space
          sectionText = sectionText.replace(/\s+/g, " ");

          // Removing whitespace before and after text
          sectionText = sectionText.trim();

          const words = sectionText.split(" ");

          const section = new Section(
            sectionObj.title,
            sectionObj.author,
            words
          );
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
