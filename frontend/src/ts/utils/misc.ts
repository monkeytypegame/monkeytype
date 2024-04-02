import * as Loader from "../elements/loader";
import { envConfig } from "../constants/env-config";
import { roundTo2, randomIntFromRange } from "./numbers";
import * as GetData from "./get-data";

export function getLastChar(word: string): string {
  try {
    return word.charAt(word.length - 1);
  } catch {
    return "";
  }
}

export function capitalizeFirstLetterOfEachWord(str: string): string {
  return str
    .split(/ +/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isASCIILetter(c: string): boolean {
  return c.length === 1 && /[a-z]/i.test(c);
}

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

export function secondsToString(
  sec: number,
  alwaysShowMinutes = false,
  alwaysShowHours = false,
  delimiter: ":" | "text" = ":",
  showSeconds = true,
  showDays = false
): string {
  sec = Math.abs(sec);
  let days = 0;
  let hours;
  if (showDays) {
    days = Math.floor(sec / 86400);
    hours = Math.floor((sec % 86400) / 3600);
  } else {
    hours = Math.floor(sec / 3600);
  }
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = roundTo2((sec % 3600) % 60);

  let daysString;
  let hoursString;
  let minutesString;
  let secondsString;

  if (showDays) {
    days < 10 && delimiter !== "text"
      ? (daysString = "0" + days)
      : (daysString = days);
  }
  hours < 10 && delimiter !== "text"
    ? (hoursString = "0" + hours)
    : (hoursString = hours);
  minutes < 10 && delimiter !== "text"
    ? (minutesString = "0" + minutes)
    : (minutesString = minutes);
  seconds < 10 &&
  (minutes > 0 || hours > 0 || alwaysShowMinutes) &&
  delimiter !== "text"
    ? (secondsString = "0" + seconds)
    : (secondsString = seconds);

  let ret = "";
  if (days > 0 && showDays) {
    ret += daysString;
    if (delimiter === "text") {
      if (days === 1) {
        ret += " day ";
      } else {
        ret += " days ";
      }
    } else {
      ret += delimiter;
    }
  }
  if (hours > 0 || alwaysShowHours) {
    ret += hoursString;
    if (delimiter === "text") {
      if (hours === 1) {
        ret += " hour ";
      } else {
        ret += " hours ";
      }
    } else {
      ret += delimiter;
    }
  }
  if (minutes > 0 || hours > 0 || alwaysShowMinutes) {
    ret += minutesString;
    if (delimiter === "text") {
      if (minutes === 1) {
        ret += " minute ";
      } else {
        ret += " minutes ";
      }
    } else if (showSeconds) {
      ret += delimiter;
    }
  }
  if (showSeconds) {
    ret += secondsString;
    if (delimiter === "text") {
      if (seconds === 1) {
        ret += " second";
      } else {
        ret += " seconds";
      }
    }
  }
  if (hours === 0 && minutes === 0 && !showSeconds && delimiter === "text") {
    ret = "less than 1 minute";
  }
  return ret.trim();
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

export function convertNumberToNepali(numString: string): string {
  const nepaliIndic = "०१२३४५६७८९";
  let ret = "";
  for (const char of numString) {
    ret += nepaliIndic[parseInt(char)];
  }
  return ret;
}

// code for "generateStep" is from Mirin's "Queue" modfile,
// converted from lua to typescript by Spax
// lineout: https://youtu.be/LnnArS9yrSs
let footTrack = false;
let currFacing = 0;
let facingCount = 0;
let lastLeftStep = 0,
  lastRightStep = 3,
  leftStepCount = 0,
  rightStepCount = 0;
function generateStep(leftRightOverride: boolean): number {
  facingCount--;
  let randomStep = Math.round(Math.random());
  let stepValue = Math.round(Math.random() * 5 - 0.5);
  if (leftRightOverride) {
    footTrack = Boolean(Math.round(Math.random()));
    if (footTrack) stepValue = 3;
    else stepValue = 0;
  } else {
    //right foot
    if (footTrack) {
      if (lastLeftStep === randomStep) leftStepCount++;
      else leftStepCount = 0;
      if (leftStepCount > 1 || (rightStepCount > 0 && leftStepCount > 0)) {
        randomStep = 1 - randomStep;
        leftStepCount = 0;
      }
      lastLeftStep = randomStep;
      stepValue = randomStep * (currFacing + 1);
      //left foot
    } else {
      if (lastRightStep === randomStep) rightStepCount++;
      else rightStepCount = 0;
      if (rightStepCount > 1 || (rightStepCount > 0 && leftStepCount > 0)) {
        randomStep = 1 - randomStep;
        rightStepCount = 0;
      }
      lastRightStep = randomStep;
      stepValue = 3 - randomStep * (currFacing + 1);
    }
    //alternation
    footTrack = !footTrack;

    if (facingCount < 0 && randomStep === 0) {
      currFacing = 1 - currFacing;
      facingCount = Math.floor(Math.random() * 3) + 3;
    }
  }

  return stepValue;
}

export function chart2Word(first: boolean): string {
  const arrowArray = ["←", "↓", "↑", "→"];
  let measure = "";
  for (let i = 0; i < 4; i++) {
    measure += arrowArray[generateStep(i === 0 && first)];
  }

  return measure;
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

//credit: https://www.w3resource.com/javascript-exercises/javascript-string-exercise-32.php
export function remove_non_ascii(str: string): string {
  if (str === null || str === "") return "";
  else str = str.toString();

  return str.replace(/[^\x20-\x7E]/g, "");
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeHTML(str: string): string {
  str = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return str;
}

export function cleanTypographySymbols(textToClean: string): string {
  const specials = {
    "“": '"', // &ldquo;	&#8220;
    "”": '"', // &rdquo;	&#8221;
    "’": "'", // &lsquo;	&#8216;
    "‘": "'", // &rsquo;	&#8217;
    ",": ",", // &sbquo;	&#8218;
    "—": "-", // &mdash;  &#8212;
    "…": "...", // &hellip; &#8230;
    "«": "<<",
    "»": ">>",
    "–": "-",
    " ": " ",
    " ": " ",
    " ": " ",
  };
  return textToClean.replace(
    /[“”’‘—,…«»–\u2007\u202F\u00A0]/g,
    (char) => specials[char as keyof typeof specials] || ""
  );
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
  CustomText: SharedTypes.CustomText,
  customTextIsLong: boolean
): boolean {
  const wordsLong = mode === "words" && (words >= 1000 || words === 0);
  const timeLong = mode === "time" && (time >= 900 || time === 0);
  const customTextLong = mode === "custom" && customTextIsLong;
  const customTextRandomWordsLong =
    mode === "custom" && CustomText.isWordRandom && CustomText.word >= 1000;
  const customTextRandomTimeLong =
    mode === "custom" && CustomText.isTimeRandom && CustomText.time > 900;
  const customTextNoRandomLong =
    mode === "custom" &&
    !CustomText.isWordRandom &&
    !CustomText.isTimeRandom &&
    CustomText.text.length >= 1000;

  if (
    wordsLong ||
    timeLong ||
    customTextLong ||
    customTextRandomWordsLong ||
    customTextRandomTimeLong ||
    customTextNoRandomLong
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

export function replaceCharAt(str: string, index: number, chr: string): string {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
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

//https://stackoverflow.com/questions/36532307/rem-px-in-javascript
export function convertRemToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
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

export function getMode2<M extends keyof SharedTypes.PersonalBests>(
  config: SharedTypes.Config,
  randomQuote: MonkeyTypes.Quote | null
): SharedTypes.Config.Mode2<M> {
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

  return retVal as SharedTypes.Config.Mode2<M>;
}

export async function downloadResultsCSV(
  array: SharedTypes.Result<SharedTypes.Config.Mode>[]
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
    ...array.map((item: SharedTypes.Result<SharedTypes.Config.Mode>) => [
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

/**
 * Shuffle an array of elements using the Fisher–Yates algorithm.
 * This function mutates the input array.
 * @param elements
 */
export function shuffle<T>(elements: T[]): void {
  for (let i = elements.length - 1; i > 0; --i) {
    const j = randomIntFromRange(0, i);
    const temp = elements[j];
    elements[j] = elements[i] as T;
    elements[i] = temp as T;
  }
}

export function randomElementFromArray<T>(array: T[]): T {
  return array[randomIntFromRange(0, array.length - 1)] as T;
}

export function nthElementFromArray<T>(
  array: T[],
  index: number
): T | undefined {
  index = index < 0 ? array.length + index : index;
  return array[index];
}

export function randomElementFromObject<T extends object>(
  object: T
): T[keyof T] {
  return randomElementFromArray(Object.values(object));
}

export function createErrorMessage(error: unknown, message: string): string {
  if (error instanceof Error) {
    return `${message}: ${error.message}`;
  }

  const objectWithMessage = error as { message?: string };

  if (objectWithMessage?.message !== undefined) {
    return `${message}: ${objectWithMessage.message}`;
  }

  return message;
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

export function areUnsortedArraysEqual(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((v) => b.includes(v));
}

export function areSortedArraysEqual(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function intersect<T>(a: T[], b: T[], removeDuplicates = false): T[] {
  let t;
  if (b.length > a.length) (t = b), (b = a), (a = t); // indexOf to loop over shorter
  const filtered = a.filter(function (e) {
    return b.includes(e);
  });
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}

export function htmlToText(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent as string) || el.innerText || "";
}

export function camelCaseToWords(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
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

export function dreymarIndex(arrayLength: number): number {
  const n = arrayLength;
  const g = 0.5772156649;
  const M = Math.log(n) + g;
  const r = Math.random();
  const h = Math.exp(r * M - g);
  const W = Math.ceil(h);
  return W - 1;
}

export async function checkIfLanguageSupportsZipf(
  language: string
): Promise<"yes" | "no" | "unknown"> {
  const lang = await GetData.getLanguage(language);
  if (lang.orderedByFrequency === true) return "yes";
  if (lang.orderedByFrequency === false) return "no";
  return "unknown";
}

export function getCurrentDayTimestamp(hourOffset = 0): number {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const currentTime = Date.now();
  return getStartOfDayTimestamp(currentTime, offsetMilis);
}

const MILISECONDS_IN_HOUR = 3600000;
const MILLISECONDS_IN_DAY = 86400000;

export function getStartOfDayTimestamp(
  timestamp: number,
  offsetMilis = 0
): number {
  return timestamp - ((timestamp - offsetMilis) % MILLISECONDS_IN_DAY);
}

export function isYesterday(timestamp: number, hourOffset = 0): boolean {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const yesterday = getStartOfDayTimestamp(
    Date.now() - MILLISECONDS_IN_DAY,
    offsetMilis
  );
  const date = getStartOfDayTimestamp(timestamp, offsetMilis);

  return yesterday === date;
}

export function isToday(timestamp: number, hourOffset = 0): boolean {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const today = getStartOfDayTimestamp(Date.now(), offsetMilis);
  const date = getStartOfDayTimestamp(timestamp, offsetMilis);

  return today === date;
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

//https://ricardometring.com/javascript-replace-special-characters
export function replaceSpecialChars(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
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

export function lastElementFromArray<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

export function getLanguageDisplayString(
  language: string,
  noSizeString = false
): string {
  let out = "";
  if (noSizeString) {
    out = removeLanguageSize(language);
  } else {
    out = language;
  }
  return out.replace(/_/g, " ");
}

export function removeLanguageSize(language: string): string {
  return language.replace(/_\d*k$/g, "");
}

// DO NOT ALTER GLOBAL OBJECTSONSTRUCTOR, IT WILL BREAK RESULT HASHES
