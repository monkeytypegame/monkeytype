import { getJSON } from "../utils/misc";
import { hexToHSL } from "../utils/misc";

const layoutsListPromise = getJSON(
  "layouts/_list.json"
) as Promise<MonkeyTypes.Layouts>;

export async function getLayouts(): Promise<MonkeyTypes.Layouts> {
  return await layoutsListPromise;
}

export async function getLayout(
  layoutName: string
): Promise<MonkeyTypes.Layout> {
  return (await layoutsListPromise)[layoutName];
}

type Theme = { name: string; bgColor: string; mainColor: string };
const themesPromise = getJSON("themes/_list.json") as Promise<Theme[]>;

export async function getThemes(): Promise<Theme[]> {
  return (await themesPromise).sort(function (a: Theme, b: Theme) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}

export async function getSortedThemes(): Promise<Theme[]> {
  return (await themesPromise).sort((a, b) => {
    const b1 = hexToHSL(a.bgColor);
    const b2 = hexToHSL(b.bgColor);
    return b2.lgt - b1.lgt;
  });
}

const funboxPromise = getJSON("funbox/_list.json") as Promise<
  MonkeyTypes.FunboxObject[]
>;

export async function getFunboxes(): Promise<MonkeyTypes.FunboxObject[]> {
  return (await funboxPromise).sort(function (a, b) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}

export async function getFunbox(
  funbox: string
): Promise<MonkeyTypes.FunboxObject | undefined> {
  return (await funboxPromise).find(function (element) {
    return element.name == funbox;
  });
}

type Font = { name: string; display?: string };
const fontsPromise = getJSON("fonts/_list.json") as Promise<Font[]>;

export async function getFonts(): Promise<Font[]> {
  return (await fontsPromise).sort(function (a: Font, b: Font) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}

const supportersPromise = getJSON("about/supporters.json") as Promise<string[]>;
export async function getSupporters(): Promise<string[]> {
  return await supportersPromise;
}

const contributorsPromise = getJSON("about/contributors.json") as Promise<
  string[]
>;
export async function getContributors(): Promise<string[]> {
  return await contributorsPromise;
}

const languagesPromise = getJSON("languages/_list.json") as Promise<string[]>;
export async function getLanguages(): Promise<string[]> {
  return await languagesPromise;
}

const languageGroupsPromise = getJSON("languages/_groups.json") as Promise<
  MonkeyTypes.LanguageGroup[]
>;
export async function getLanguageGroups(): Promise<
  MonkeyTypes.LanguageGroup[]
> {
  return await languageGroupsPromise;
}

let currentLanguage: MonkeyTypes.LanguageObject | undefined;
let currentLanguagePromise: Promise<MonkeyTypes.LanguageObject> | undefined;
export async function getLanguage(
  lang: string
): Promise<MonkeyTypes.LanguageObject> {
  try {
    if (!currentLanguage || currentLanguage.name !== lang) {
      currentLanguagePromise = getJSON(
        `languages/${lang}.json`
      ) as Promise<MonkeyTypes.LanguageObject>;
    }
    return (await currentLanguagePromise) as MonkeyTypes.LanguageObject;
  } catch (e) {
    console.error(`error getting language`);
    console.error(e);
    currentLanguagePromise = getJSON(
      `languages/english.json`
    ) as Promise<MonkeyTypes.LanguageObject>;
    return await currentLanguagePromise;
  }
}

export async function getLanguageGroup(
  language: string
): Promise<MonkeyTypes.LanguageGroup | undefined> {
  let retgroup: MonkeyTypes.LanguageGroup | undefined;
  const groups = await getLanguageGroups();
  groups.forEach((group) => {
    if (retgroup === undefined) {
      if (group.languages.includes(language)) {
        retgroup = group;
      }
    }
  });
  return retgroup;
}
