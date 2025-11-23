import { Language, LanguageObject } from "@monkeytype/schemas/languages";
import { Challenge } from "@monkeytype/schemas/challenges";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import { toHex } from "./strings";
import { languageHashes } from "virtual:language-hashes";
import { isDevEnvironment } from "./misc";

//pin implementation
const fetch = window.fetch;
const cryptoSubtle = window.crypto.subtle;

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
      if (!res.headers.get("content-type")?.startsWith("application/json")) {
        throw new Error("Content is not JSON");
      }
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
 * Fetches a layout by name from the server.
 * @param layoutName The name of the layout to fetch.
 * @returns A promise that resolves to the layout object.
 * @throws {Error} If the layout list or layout doesn't exist.
 */
export async function getLayout(layoutName: string): Promise<LayoutObject> {
  return await cachedFetchJson<LayoutObject>(`/layouts/${layoutName}.json`);
}

// used for polyglot wordset language-specific properties
export type LanguageProperties = Pick<
  LanguageObject,
  "noLazyMode" | "ligatures" | "rightToLeft" | "additionalAccents"
>;

let currentLanguage: LanguageObject;

/**
 * Fetches the language object for a given language from the server.
 * @param lang The language code.
 * @returns A promise that resolves to the language object.
 */
export async function getLanguage(lang: Language): Promise<LanguageObject> {
  // try {
  if (currentLanguage === undefined || currentLanguage.name !== lang) {
    const loaded = await cachedFetchJson<LanguageObject>(
      `/languages/${lang}.json`
    );

    if (!isDevEnvironment()) {
      //check the content to make it less easy to manipulate
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(loaded, null, 0));
      const hashBuffer = await cryptoSubtle.digest("SHA-256", data);
      const hash = toHex(hashBuffer);
      if (hash !== languageHashes[lang]) {
        throw new Error(
          "Integrity check failed. Try refreshing the page. If this error persists, please contact support."
        );
      }
    }
    currentLanguage = loaded;
  }
  return currentLanguage;
}

export async function checkIfLanguageSupportsZipf(
  language: Language
): Promise<"yes" | "no" | "unknown"> {
  const lang = await getLanguage(language);
  if (lang.orderedByFrequency === true) return "yes";
  if (lang.orderedByFrequency === false) return "no";
  return "unknown";
}

/**
 * Fetches the current language object.
 * @param languageName The name of the language.
 * @returns A promise that resolves to the current language object.
 */
export async function getCurrentLanguage(
  languageName: Language
): Promise<LanguageObject> {
  return await getLanguage(languageName);
}

export class Section {
  public title: string;
  public author: string;
  public words: string[];
  constructor(title: string, author: string, words: string[]) {
    this.title = title;
    this.author = author;
    this.words = words;
  }
}

export type FunboxWordOrder = "normal" | "reverse";

/**
 * Fetches the list of challenges from the server.
 * @returns A promise that resolves to the list of challenges.
 */
export async function getChallengeList(): Promise<Challenge[]> {
  const data = await cachedFetchJson<Challenge[]>("/challenges/_list.json");
  return data;
}

/**
 * Fetches the list of supporters from the server.
 * @returns A promise that resolves to the list of supporters.
 */
export async function getSupportersList(): Promise<string[]> {
  const data = await cachedFetchJson<string[]>("/about/supporters.json");
  return data;
}

/**
 * Fetches the list of contributors from the server.
 * @returns A promise that resolves to the list of contributors.
 */
export async function getContributorsList(): Promise<string[]> {
  const data = await cachedFetchJson<string[]>("/about/contributors.json");
  return data;
}

type GithubRelease = {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: unknown[];
  tarball_url: string;
  zipball_url: string;
  body: string;
  reactions: {
    url: string;
    total_count: number;
    [reaction: string]: number | string;
  };
};

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
export async function getReleasesFromGitHub(): Promise<GithubRelease[]> {
  return cachedFetchJson(
    "https://api.github.com/repos/monkeytypegame/monkeytype/releases?per_page=5"
  );
}

export type Emoji = {
  type: "image" | "emoji";
  from: string;
  to: string;
};

export async function getEmojiList(): Promise<Emoji[]> {
  try {
    const data = await cachedFetchJson<Emoji[]>("/./emoji/_list.json");
    return data;
  } catch (e) {
    throw new Error("Emoji list JSON fetch failed");
  }
}
