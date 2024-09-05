import * as Loader from "../elements/loader";
import { envConfig } from "../constants/env-config";
import { lastElementFromArray } from "./arrays";
import * as JSONData from "./json-data";
import { Config } from "@monkeytype/contracts/schemas/configs";
import {
  Mode,
  Mode2,
  PersonalBests,
} from "@monkeytype/contracts/schemas/shared";

export function kogasa(cov: number): number {
  return (
    100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5))
  );
}

export function whorf(speed: number, wordlen: number): number {
  return Math.min(
    speed,
    Math.floor(speed * Math.pow(1.03, -2 * (wordlen - 3)))
  );
}

//convert numbers to arabic-indic
export function convertNumberToArabic(numString: string): string {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  let ret = "";
  for (const char of numString) {
    ret += arabicIndic[parseInt(char)];
  }
  return ret;
}

export function convertNumberToBangla(numString: string): string {
  const banglaIndic = "০১২৩৪৫৬৭৮৯";
  let ret = "";
  for (const char of numString) {
    ret += banglaIndic[parseInt(char)];
  }
  return ret;
}

export function convertNumberToNepali(numString: string): string {
  const nepaliIndic = "०१२३४५६७८९";
  let ret = "";
  for (const char of numString) {
    ret += nepaliIndic[parseInt(char)];
  }
  return ret;
}

export function convertNumberToHindi(numString: string): string {
  const hindiIndic = "०१२३४५६७८९";
  let ret = "";
  for (const char of numString) {
    ret += hindiIndic[parseInt(char)];
  }
  return ret;
}

export function findGetParameter(
  parameterName: string,
  getOverride?: string
): string | null {
  let result = null;
  let tmp = [];

  let search = location.search;
  if (getOverride !== undefined && getOverride !== "") {
    search = getOverride;
  }

  search
    .slice(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName)
        result = decodeURIComponent(tmp[1] as string);
    });
  return result;
}

export function checkIfGetParameterExists(
  parameterName: string,
  getOverride?: string
): boolean {
  let result = false;
  let tmp = [];

  let search = location.search;
  if (getOverride !== undefined && getOverride !== "") {
    search = getOverride;
  }

  search
    .slice(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = true;
    });
  return result;
}

export function objectToQueryString<T extends string | number | boolean>(
  obj: Record<string, T | T[]>
): string {
  const str = [];
  for (const p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      // Arrays get encoded as a comma(%2C)-separated list
      str.push(
        encodeURIComponent(p) + "=" + encodeURIComponent(obj[p] as unknown as T)
      );
    }
  }
  return str.join("&");
}

declare global {
  // type gets a "Duplicate identifier" error
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Document {
    mozCancelFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitFullscreenElement?: Element;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface HTMLElement {
    msRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
  }
}

export function toggleFullscreen(): void {
  const elem = document.documentElement;
  if (
    !document.fullscreenElement &&
    !document.mozFullScreenElement &&
    !document.webkitFullscreenElement &&
    !document.msFullscreenElement
  ) {
    if (elem.requestFullscreen !== undefined) {
      void elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      void elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      void elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      // @ts-expect-error
      void elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen !== undefined) {
      void document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      void document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      void document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      void document.webkitExitFullscreen();
    }
  }
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeHTML(str: string): string {
  if (str === null || str === undefined) {
    return str;
  }
  str = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return str;
}

export function isUsernameValid(name: string): boolean {
  if (name === null || name === undefined || name === "") return false;
  if (name.toLowerCase().includes("miodec")) return false;
  if (name.toLowerCase().includes("bitly")) return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

export function mapRange(
  x: number,
  in_min: number,
  in_max: number,
  out_min: number,
  out_max: number
): number {
  let num = ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;

  if (out_min > out_max) {
    if (num > out_min) {
      num = out_min;
    } else if (num < out_max) {
      num = out_max;
    }
  } else {
    if (num < out_min) {
      num = out_min;
    } else if (num > out_max) {
      num = out_max;
    }
  }
  return num;
}

export function canQuickRestart(
  mode: string,
  words: number,
  time: number,
  CustomText: MonkeyTypes.CustomTextData,
  customTextIsLong: boolean
): boolean {
  const wordsLong = mode === "words" && (words >= 1000 || words === 0);
  const timeLong = mode === "time" && (time >= 900 || time === 0);
  const customTextLong = mode === "custom" && customTextIsLong;

  const customTextRandomWordsLong =
    mode === "custom" &&
    (CustomText.limit.mode === "word" || CustomText.limit.mode === "section") &&
    (CustomText.limit.value >= 1000 || CustomText.limit.value === 0);
  const customTextRandomTimeLong =
    mode === "custom" &&
    CustomText.limit.mode === "time" &&
    (CustomText.limit.value >= 900 || CustomText.limit.value === 0);

  if (
    wordsLong ||
    timeLong ||
    customTextLong ||
    customTextRandomWordsLong ||
    customTextRandomTimeLong
  ) {
    return false;
  } else {
    return true;
  }
}

export function clearTimeouts(timeouts: (number | NodeJS.Timeout)[]): void {
  timeouts.forEach((to) => {
    if (typeof to === "number") clearTimeout(to);
    else clearTimeout(to);
  });
}

//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr
export function regexIndexOf(
  string: string,
  regex: RegExp,
  startpos: number
): number {
  const indexOf = string.substring(startpos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf;
}

type LastIndex = {
  lastIndexOfRegex(regex: RegExp): number;
} & string;

(String.prototype as LastIndex).lastIndexOfRegex = function (
  regex: RegExp
): number {
  const match = this.match(regex);
  return match ? this.lastIndexOf(lastElementFromArray(match) as string) : -1;
};

export const trailingComposeChars = /[\u02B0-\u02FF`´^¨~]+$|⎄.*$/;

export async function getDiscordAvatarUrl(
  discordId?: string,
  discordAvatar?: string,
  discordAvatarSize = 32
): Promise<string | null> {
  if (
    discordId === undefined ||
    discordId === "" ||
    discordAvatar === undefined ||
    discordAvatar === ""
  ) {
    return null;
  }
  // An invalid request to this URL will return a 404.
  try {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=${discordAvatarSize}`;

    const response = await fetch(avatarUrl, {
      method: "HEAD",
    });
    if (!response.ok) {
      return null;
    }

    return avatarUrl;
  } catch (error) {}

  return null;
}

export async function swapElements(
  el1: JQuery,
  el2: JQuery,
  totalDuration: number,
  callback = async function (): Promise<void> {
    return Promise.resolve();
  },
  middleCallback = async function (): Promise<void> {
    return Promise.resolve();
  }
): Promise<boolean | undefined> {
  if (
    (el1.hasClass("hidden") && !el2.hasClass("hidden")) ||
    (!el1.hasClass("hidden") && el2.hasClass("hidden"))
  ) {
    //one of them is hidden and the other is visible
    if (el1.hasClass("hidden")) {
      await middleCallback();
      await callback();
      return false;
    }
    $(el1)
      .removeClass("hidden")
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        totalDuration / 2,
        async () => {
          await middleCallback();
          $(el1).addClass("hidden");
          $(el2)
            .removeClass("hidden")
            .css("opacity", 0)
            .animate(
              {
                opacity: 1,
              },
              totalDuration / 2,
              async () => {
                await callback();
              }
            );
        }
      );
  } else if (el1.hasClass("hidden") && el2.hasClass("hidden")) {
    //both are hidden, only fade in the second
    await middleCallback();
    $(el2)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        totalDuration,
        async () => {
          await callback();
        }
      );
  } else {
    await middleCallback();
    await callback();
  }

  return;
}

export function getMode2<M extends keyof PersonalBests>(
  config: Config,
  randomQuote: MonkeyTypes.Quote | null
): Mode2<M> {
  const mode = config.mode;
  let retVal: string;

  if (mode === "time") {
    retVal = config.time.toString();
  } else if (mode === "words") {
    retVal = config.words.toString();
  } else if (mode === "custom") {
    retVal = "custom";
  } else if (mode === "zen") {
    retVal = "zen";
  } else if (mode === "quote") {
    retVal = `${randomQuote?.id ?? -1}`;
  } else {
    throw new Error("Invalid mode");
  }

  return retVal as Mode2<M>;
}

export async function downloadResultsCSV(
  array: MonkeyTypes.FullResult<Mode>[]
): Promise<void> {
  Loader.show();
  const csvString = [
    [
      "_id",
      "isPb",
      "wpm",
      "acc",
      "rawWpm",
      "consistency",
      "charStats",
      "mode",
      "mode2",
      "quoteLength",
      "restartCount",
      "testDuration",
      "afkDuration",
      "incompleteTestSeconds",
      "punctuation",
      "numbers",
      "language",
      "funbox",
      "difficulty",
      "lazyMode",
      "blindMode",
      "bailedOut",
      "tags",
      "timestamp",
    ],
    ...array.map((item: MonkeyTypes.FullResult<Mode>) => [
      item._id,
      item.isPb,
      item.wpm,
      item.acc,
      item.rawWpm,
      item.consistency,
      item.charStats.join(";"),
      item.mode,
      item.mode2,
      item.quoteLength,
      item.restartCount,
      item.testDuration,
      item.afkDuration,
      item.incompleteTestSeconds,
      item.punctuation,
      item.numbers,
      item.language,
      item.funbox,
      item.difficulty,
      item.lazyMode,
      item.blindMode,
      item.bailedOut,
      item.tags.join(";"),
      item.timestamp,
    ]),
  ]
    .map((e) => e.join(","))
    .join("\n");

  const blob = new Blob([csvString], { type: "text/csv" });

  const href = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", href);
  link.setAttribute("download", "results.csv");
  document.body.appendChild(link); // Required for FF

  link.click();
  link.remove();
  Loader.hide();
}

export function createErrorMessage(error: unknown, message: string): string {
  if (error instanceof Error) {
    return `${message}: ${error.message}`;
  }

  if (error instanceof Object && "message" in error) {
    const objectWithMessage = error as { message?: string };

    if (objectWithMessage?.message !== undefined) {
      return `${message}: ${objectWithMessage.message}`;
    }
  }

  console.error("Unknown error", error);
  return `${message}: Unknown error`;
}

export function isElementVisible(query: string): boolean {
  const el = document.querySelector(query);
  if (!el) {
    return false;
  }
  // const style = window.getComputedStyle(el);
  return !!el.getClientRects().length;
}

export function isPopupVisible(popupId: string): boolean {
  return isElementVisible(`#popups #${popupId}`);
}

export function isAnyPopupVisible(): boolean {
  const popups = document.querySelectorAll(
    "#popups .popupWrapper, #popups .backdrop, #popups .modalWrapper"
  );
  let popupVisible = false;
  for (const popup of popups) {
    if (isPopupVisible(popup.id)) {
      popupVisible = true;
      break;
    }
  }
  return popupVisible;
}

export async function promiseAnimation(
  el: JQuery,
  animation: Record<string, string>,
  duration: number,
  easing: string
): Promise<void> {
  return new Promise((resolve) => {
    el.animate(animation, duration, easing, resolve);
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function isPasswordStrong(password: string): boolean {
  const hasCapital = !!password.match(/[A-Z]/);
  const hasNumber = !!password.match(/[\d]/);
  const hasSpecial = !!password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/);
  const isLong = password.length >= 8;
  const isShort = password.length <= 64;
  return hasCapital && hasNumber && hasSpecial && isLong && isShort;
}

export function htmlToText(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent as string) || el.innerText || "";
}

export function loadCSS(href: string, prepend = false): void {
  const link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = href;

  const head = document.getElementsByTagName("head")[0];

  if (head === undefined) {
    throw new Error("Could not load CSS - head is undefined");
  }

  if (prepend) {
    head.prepend(link);
  } else {
    head.appendChild(link);
  }
}

export function isDevEnvironment(): boolean {
  return envConfig.isDevelopment;
}

export function zipfyRandomArrayIndex(dictLength: number): number {
  /**
   * get random index based on probability distribution of Zipf's law,
   * where PMF is (1/n)/H_N,
   * where H_N is the Harmonic number of (N), where N is dictLength
   * and the harmonic number is approximated using the formula:
   * H_n = ln(n + 0.5) + gamma
   */
  const gamma = 0.5772156649015329; // Euler–Mascheroni constant
  const H_N = Math.log(dictLength + 0.5) + gamma; // approximation of H_N
  const r = Math.random();
  /* inverse of CDF where CDF is H_n/H_N */
  const inverseCDF = Math.exp(r * H_N - gamma) - 0.5;
  return Math.floor(inverseCDF);
}

export async function checkIfLanguageSupportsZipf(
  language: string
): Promise<"yes" | "no" | "unknown"> {
  const lang = await JSONData.getLanguage(language);
  if (lang.orderedByFrequency === true) return "yes";
  if (lang.orderedByFrequency === false) return "no";
  return "unknown";
}

// Function to get the bounding rectangle of a collection of elements
export function getBoundingRectOfElements(elements: HTMLElement[]): DOMRect {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();

    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });

  // Create a new object with the same properties as a DOMRect
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    top: minY,
    right: maxX,
    bottom: maxY,
    left: minX,
    toJSON: function (): string {
      return JSON.stringify({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        top: this.top,
        right: this.right,
        bottom: this.bottom,
        left: this.left,
      });
    },
  };
}

export function typedKeys<T extends object>(
  obj: T
): T extends T ? (keyof T)[] : never {
  return Object.keys(obj) as unknown as T extends T ? (keyof T)[] : never;
}

export function reloadAfter(seconds: number): void {
  setTimeout(() => {
    window.location.reload();
  }, seconds * 1000);
}

export function updateTitle(title?: string): void {
  const local = isDevEnvironment() ? "localhost - " : "";

  if (title === undefined || title === "") {
    document.title =
      local + "Monkeytype | A minimalistic, customizable typing test";
  } else {
    document.title = local + title;
  }
}

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}

// DO NOT ALTER GLOBAL OBJECTSONSTRUCTOR, IT WILL BREAK RESULT HASHES
