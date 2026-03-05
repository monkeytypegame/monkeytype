import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as JSONData from "../utils/json-data";
import { z } from "zod";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { Language } from "@monkeytype/schemas/languages";

type Post = {
  title: string;
  author: string;
  pageid: number;
};

type SectionObject = {
  title: string;
  author: string;
};

// Section Schema
const SectionSchema = z.object({
  query: z.object({
    pages: z.record(
      z.string(),
      z.object({
        extract: z.string(),
      }),
    ),
  }),
});

export async function getSection(
  language: Language,
): Promise<JSONData.Section> {
  // console.log("Getting section");
  showLoaderBar();

  // get TLD for wikipedia according to language group
  const languageProperties = await JSONData.getLanguage(language);
  const urlTLD = languageProperties.bcp47?.split("-")[0] ?? "en";

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
      hideLoaderBar();
      rej(randomPostReq.status);
    }
    const sectionURL = `https://${urlTLD}.wikipedia.org/w/api.php?action=query&format=json&pageids=${pageid}&prop=extracts&exintro=true&origin=*`;

    const sectionReq = new XMLHttpRequest();
    sectionReq.onload = (): void => {
      if (sectionReq.readyState === 4) {
        if (sectionReq.status === 200) {
          const parsedResponse = parseJsonWithSchema(
            sectionReq.responseText,
            SectionSchema,
          );
          const page = parsedResponse.query.pages[pageid.toString()];
          if (!page) {
            hideLoaderBar();
            rej("Page not found");
            return;
          }
          let sectionText = page.extract;

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
            words,
          );
          hideLoaderBar();
          res(section);
        } else {
          hideLoaderBar();
          rej(sectionReq.status);
        }
      }
    };
    sectionReq.open("GET", sectionURL);
    sectionReq.send();
  });
}
