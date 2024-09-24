import * as Loader from "../elements/loader";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as JSONData from "../utils/json-data";

export async function getTLD(
  languageGroup: JSONData.LanguageGroup
): Promise<
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ar"
  | "it"
  | "la"
  | "af"
  | "ko"
  | "ru"
  | "pl"
  | "cs"
  | "sk"
  | "uk"
  | "lt"
  | "id"
  | "el"
  | "tr"
  | "th"
  | "ta"
  | "sl"
  | "hr"
  | "nl"
  | "da"
  | "hu"
  | "no"
  | "nn"
  | "he"
  | "ms"
  | "ro"
  | "fi"
  | "et"
  | "cy"
  | "fa"
  | "kk"
  | "vi"
  | "sv"
  | "sr"
  | "ka"
  | "ca"
  | "bg"
  | "eo"
  | "bn"
  | "ur"
  | "hy"
  | "my"
  | "hi"
  | "mk"
  | "uz"
  | "be"
  | "az"
  | "lv"
  | "eu"
> {
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

    case "arabic":
      return "ar";

    case "italian":
      return "it";

    case "latin":
      return "la";

    case "afrikaans":
      return "af";

    case "korean":
      return "ko";

    case "russian":
      return "ru";

    case "polish":
      return "pl";

    case "czech":
      return "cs";

    case "slovak":
      return "sk";

    case "ukrainian":
      return "uk";

    case "lithuanian":
      return "lt";

    case "indonesian":
      return "id";

    case "greek":
      return "el";

    case "turkish":
      return "tr";

    case "thai":
      return "th";

    case "tamil":
      return "ta";

    case "slovenian":
      return "sl";

    case "croatian":
      return "hr";

    case "dutch":
      return "nl";

    case "danish":
      return "da";

    case "hungarian":
      return "hu";

    case "norwegian_bokmal":
      return "no";

    case "norwegian_nynorsk":
      return "nn";

    case "hebrew":
      return "he";

    case "malay":
      return "ms";

    case "romanian":
      return "ro";

    case "finnish":
      return "fi";

    case "estonian":
      return "et";

    case "welsh":
      return "cy";

    case "persian":
      return "fa";

    case "kazakh":
      return "kk";

    case "vietnamese":
      return "vi";

    case "swedish":
      return "sv";

    case "serbian":
      return "sr";

    case "georgian":
      return "ka";

    case "catalan":
      return "ca";

    case "bulgarian":
      return "bg";

    case "esperanto":
      return "eo";

    case "bangla":
      return "bn";

    case "urdu":
      return "ur";

    case "armenian":
      return "hy";

    case "myanmar":
      return "my";

    case "hindi":
      return "hi";

    case "macedonian":
      return "mk";

    case "uzbek":
      return "uz";

    case "belarusian":
      return "be";

    case "azerbaijani":
      return "az";

    case "latvian":
      return "lv";

    case "euskera":
      return "eu";

    default:
      return "en";
  }
}

type Post = {
  title: string;
  author: string;
  pageid: number;
};

type SectionObject = {
  title: string;
  author: string;
};

export async function getSection(language: string): Promise<JSONData.Section> {
  // console.log("Getting section");
  Loader.show();

  // get TLD for wikipedia according to language group
  let urlTLD = "en";

  let currentLanguageGroup: JSONData.LanguageGroup | undefined;
  try {
    currentLanguageGroup = await JSONData.getCurrentGroup(language);
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
    const postObj = (await randomPostReq.json()) as Post;
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          let sectionText = JSON.parse(sectionReq.responseText).query.pages[
            pageid.toString()
          ].extract as string;

          // Converting to one paragraph
          sectionText = sectionText.replace(/<\/p><p>+/g, " ");

          // Convert HTML to text
          sectionText = Misc.htmlToText(sectionText);

          // Remove reference links
          sectionText = sectionText.replace(/\[\d+\]/gi, "");

          // Remove invisible characters
          sectionText = sectionText.replace(/[\u200B-\u200D\uFEFF]/g, "");

          // replace any fancy symbols
          sectionText = Strings.cleanTypographySymbols(sectionText);

          // Remove non-ascii characters for English articles
          if (urlTLD === "en") {
            sectionText = sectionText.replace(/[^\x20-\x7E]+/g, "");
          }

          // Convert all whitespace to space
          sectionText = sectionText.replace(/\s+/g, " ");

          // Removing whitespace before and after text
          sectionText = sectionText.trim();

          const words = sectionText.split(" ");

          const section = new JSONData.Section(
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
