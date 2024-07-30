import { hexToHSL } from "./colors";

/**
 * Fetches JSON data from the specified URL using the fetch API.
 * @param url - The URL to fetch the JSON data from.
 * @returns A promise that resolves to the parsed JSON data.
 * @throws {Error} If the URL is not provided or if the fetch request fails.
 */
async function fetchJson<T>(url: string): Promise<T> {
  try {
    if (!url) throw new Error("No URL");
    const res = await fetch(url);
    if (res.ok) {
      return (await res.json()) as T;
    } else {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (e) {
    console.error("Error fetching JSON: " + url, e);
    throw e;
  }
}

/**
 * Memoizes an asynchronous function.
 * @template P The type of the function's parameters.
 * @template T The type of the function.
 * @param {T} fn The asynchronous function to memoize.
 * @param {(...args: Parameters<T>) => P} [getKey] Optional function to generate cache keys based on function arguments.
 * @returns {T} The memoized function.
 */
export function memoizeAsync<P, T extends <B>(...args: P[]) => Promise<B>>(
  fn: T,
  getKey?: (...args: Parameters<T>) => P
): T {
  const cache = new Map<P, Promise<ReturnType<T>>>();

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = getKey ? getKey.apply(args) : (args[0] as P);

    if (cache.has(key)) {
      const ret = await cache.get(key);
      if (ret !== undefined) {
        return ret as ReturnType<T>;
      }
    }

    // eslint-disable-next-line prefer-spread
    const result = fn.apply(null, args) as Promise<ReturnType<T>>;
    cache.set(key, result);

    return result;
  }) as T;
}

/**
 * Memoizes the fetchJson function to cache the results of fetch requests.
 * @param url - The URL used to fetch JSON data.
 * @returns A promise that resolves to the cached JSON data.
 */
export const cachedFetchJson = memoizeAsync<string, typeof fetchJson>(
  fetchJson
);

/**
 * Fetches the layouts list from the server.
 * @returns A promise that resolves to the layouts list.
 */
export async function getLayoutsList(): Promise<MonkeyTypes.Layouts> {
  try {
    const layoutsList = await cachedFetchJson<MonkeyTypes.Layouts>(
      "/layouts/_list.json"
    );
    return layoutsList;
  } catch (e) {
    throw new Error("Layouts JSON fetch failed");
  }
}

/**
 * Fetches a layout by name from the server.
 * @param layoutName The name of the layout to fetch.
 * @returns A promise that resolves to the layout object.
 * @throws {Error} If the layout list or layout doesn't exist.
 */
export async function getLayout(
  layoutName: string
): Promise<MonkeyTypes.Layout> {
  const layouts = await getLayoutsList();
  const layout = layouts[layoutName];
  if (layout === undefined) {
    throw new Error(`Layout ${layoutName} is undefined`);
  }
  return layout;
}

let themesList: MonkeyTypes.Theme[] | undefined;

/**
 * Fetches the list of themes from the server, sorting them alphabetically by name.
 * If the list has already been fetched, returns the cached list.
 * @returns A promise that resolves to the sorted list of themes.
 */
export async function getThemesList(): Promise<MonkeyTypes.Theme[]> {
  if (!themesList) {
    let themes = await cachedFetchJson<MonkeyTypes.Theme[]>(
      "/themes/_list.json"
    );

    themes = themes.sort(function (a: MonkeyTypes.Theme, b: MonkeyTypes.Theme) {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    themesList = themes;
    return themesList;
  } else {
    return themesList;
  }
}

let sortedThemesList: MonkeyTypes.Theme[] | undefined;

/**
 * Fetches the sorted list of themes from the server.
 * @returns A promise that resolves to the sorted list of themes.
 */
export async function getSortedThemesList(): Promise<MonkeyTypes.Theme[]> {
  if (!sortedThemesList) {
    if (!themesList) {
      await getThemesList();
    }
    if (!themesList) {
      throw new Error("Themes list is undefined");
    }
    let sorted = [...themesList];
    sorted = sorted.sort((a, b) => {
      const b1 = hexToHSL(a.bgColor);
      const b2 = hexToHSL(b.bgColor);
      return b2.lgt - b1.lgt;
    });
    sortedThemesList = sorted;
    return sortedThemesList;
  } else {
    return sortedThemesList;
  }
}

/**
 * Fetches the list of languages from the server.
 * @returns A promise that resolves to the list of languages.
 */
export async function getLanguageList(): Promise<string[]> {
  try {
    const languageList = await cachedFetchJson<string[]>(
      "/languages/_list.json"
    );
    return languageList;
  } catch (e) {
    throw new Error("Language list JSON fetch failed");
  }
}

/**
 * Fetches the list of language groups from the server.
 * @returns A promise that resolves to the list of language groups.
 */
export async function getLanguageGroups(): Promise<
  MonkeyTypes.LanguageGroup[]
> {
  try {
    const languageGroupList = await cachedFetchJson<
      MonkeyTypes.LanguageGroup[]
    >("/languages/_groups.json");
    return languageGroupList;
  } catch (e) {
    throw new Error("Language groups JSON fetch failed");
  }
}

let currentLanguage: MonkeyTypes.LanguageObject;

/**
 * Fetches the language object for a given language from the server.
 * @param lang The language code.
 * @returns A promise that resolves to the language object.
 */
export async function getLanguage(
  lang: string
): Promise<MonkeyTypes.LanguageObject> {
  // try {
  if (currentLanguage === undefined || currentLanguage.name !== lang) {
    currentLanguage = await cachedFetchJson<MonkeyTypes.LanguageObject>(
      `/languages/${lang}.json`
    );
  }
  return currentLanguage;
}

/**
 * Fetches the current language object.
 * @param languageName The name of the language.
 * @returns A promise that resolves to the current language object.
 */
export async function getCurrentLanguage(
  languageName: string
): Promise<MonkeyTypes.LanguageObject> {
  return await getLanguage(languageName);
}

/**
 * Fetches the language group for a given language.
 * @param language The language code.
 * @returns A promise that resolves to the language group.
 */
export async function getCurrentGroup(
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

let funboxList: MonkeyTypes.FunboxMetadata[] | undefined;

/**
 * Fetches the list of funbox metadata from the server.
 * @returns A promise that resolves to the list of funbox metadata.
 */
export async function getFunboxList(): Promise<MonkeyTypes.FunboxMetadata[]> {
  if (!funboxList) {
    let list = await cachedFetchJson<MonkeyTypes.FunboxMetadata[]>(
      "/funbox/_list.json"
    );
    list = list.sort(function (
      a: MonkeyTypes.FunboxMetadata,
      b: MonkeyTypes.FunboxMetadata
    ) {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    funboxList = list;
    return funboxList;
  } else {
    return funboxList;
  }
}

/**
 * Fetches the funbox metadata for a given funbox from the server.
 * @param funbox The name of the funbox.
 * @returns A promise that resolves to the funbox metadata.
 */
export async function getFunbox(
  funbox: string
): Promise<MonkeyTypes.FunboxMetadata | undefined> {
  const list: MonkeyTypes.FunboxMetadata[] = await getFunboxList();
  return list.find(function (element) {
    return element.name === funbox;
  });
}

let fontsList: MonkeyTypes.FontObject[] | undefined;

/**
 * Fetches the list of font objects from the server.
 * @returns A promise that resolves to the list of font objects.
 */
export async function getFontsList(): Promise<MonkeyTypes.FontObject[]> {
  if (!fontsList) {
    let list = await cachedFetchJson<MonkeyTypes.FontObject[]>(
      "/fonts/_list.json"
    );
    list = list.sort(function (
      a: MonkeyTypes.FontObject,
      b: MonkeyTypes.FontObject
    ) {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    fontsList = list;
    return fontsList;
  } else {
    return fontsList;
  }
}

/**
 * Fetches the list of challenges from the server.
 * @returns A promise that resolves to the list of challenges.
 */
export async function getChallengeList(): Promise<MonkeyTypes.Challenge[]> {
  try {
    const data = await cachedFetchJson<MonkeyTypes.Challenge[]>(
      "/challenges/_list.json"
    );
    return data;
  } catch (e) {
    throw new Error("Challenge list JSON fetch failed");
  }
}

/**
 * Fetches the list of supporters from the server.
 * @returns A promise that resolves to the list of supporters.
 */
export async function getSupportersList(): Promise<string[]> {
  try {
    const data = await cachedFetchJson<string[]>("/about/supporters.json");
    return data;
  } catch (e) {
    throw new Error("Supporters list JSON fetch failed");
  }
}

/**
 * Fetches the list of contributors from the server.
 * @returns A promise that resolves to the list of contributors.
 */
export async function getContributorsList(): Promise<string[]> {
  try {
    const data = await cachedFetchJson<string[]>("/about/contributors.json");
    return data;
  } catch (e) {
    throw new Error("Contributors list JSON fetch failed");
  }
}

/**
 * Fetches the latest release name from GitHub.
 * @returns A promise that resolves to the latest release name.
 */
export async function getLatestReleaseFromGitHub(): Promise<string> {
  type releaseType = { name: string };
  const releases = await cachedFetchJson<releaseType[]>(
    "https://api.github.com/repos/monkeytypegame/monkeytype/releases?per_page=1"
  );
  if (releases[0] === undefined || releases[0].name === undefined) {
    throw new Error("No release found");
  }
  return releases[0].name;
}

/**
 * Fetches the list of releases from GitHub.
 * @returns A promise that resolves to the list of releases.
 */
export async function getReleasesFromGitHub(): Promise<
  MonkeyTypes.GithubRelease[]
> {
  return cachedFetchJson(
    "https://api.github.com/repos/monkeytypegame/monkeytype/releases?per_page=5"
  );
}
