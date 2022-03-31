import * as Loader from "../elements/loader";
import format from "date-fns/format";
import { Auth } from "../firebase";

export function getuid(): void {
  console.error("Only share this uid with Miodec and nobody else!");
  console.log(Auth.currentUser?.uid);
  console.error("Only share this uid with Miodec and nobody else!");
}

function hexToHSL(hex: string): {
  hue: number;
  sat: number;
  lgt: number;
  string: string;
} {
  // Convert hex to RGB first
  let r: number;
  let g: number;
  let b: number;
  if (hex.length == 4) {
    r = ("0x" + hex[1] + hex[1]) as unknown as number;
    g = ("0x" + hex[2] + hex[2]) as unknown as number;
    b = ("0x" + hex[3] + hex[3]) as unknown as number;
  } else if (hex.length == 7) {
    r = ("0x" + hex[1] + hex[2]) as unknown as number;
    g = ("0x" + hex[3] + hex[4]) as unknown as number;
    b = ("0x" + hex[5] + hex[6]) as unknown as number;
  } else {
    r = 0x00;
    g = 0x00;
    b = 0x00;
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return {
    hue: h,
    sat: s,
    lgt: l,
    string: "hsl(" + h + "," + s + "%," + l + "%)",
  };
}

export function isColorLight(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.lgt >= 50;
}

export function isColorDark(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.lgt < 50;
}

type Theme = { name: string; bgColor: string; mainColor: string };

let themesList: Theme[] = [];
export async function getThemesList(): Promise<Theme[]> {
  if (themesList.length == 0) {
    return $.getJSON("themes/_list.json", function (data) {
      const list = data.sort(function (a: Theme, b: Theme) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      themesList = list;
      return themesList;
    });
  } else {
    return themesList;
  }
}

let sortedThemesList: Theme[] = [];
export async function getSortedThemesList(): Promise<Theme[]> {
  if (sortedThemesList.length === 0) {
    if (themesList.length === 0) {
      await getThemesList();
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

let funboxList: MonkeyTypes.FunboxObject[] = [];
export async function getFunboxList(): Promise<MonkeyTypes.FunboxObject[]> {
  if (funboxList.length === 0) {
    return $.getJSON("funbox/_list.json", function (data) {
      funboxList = data.sort(function (
        a: MonkeyTypes.FunboxObject,
        b: MonkeyTypes.FunboxObject
      ) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return funboxList;
    });
  } else {
    return funboxList;
  }
}

export async function getFunbox(
  funbox: string
): Promise<MonkeyTypes.FunboxObject | undefined> {
  const list: MonkeyTypes.FunboxObject[] = await getFunboxList();
  return list.find(function (element) {
    return element.name == funbox;
  });
}

let layoutsList: MonkeyTypes.Layouts = {};
export async function getLayoutsList(): Promise<MonkeyTypes.Layouts> {
  if (Object.keys(layoutsList).length === 0) {
    return $.getJSON("layouts/_list.json", function (data) {
      layoutsList = data;
      return layoutsList;
    });
  } else {
    return layoutsList;
  }
}

export async function getLayout(
  layoutName: string
): Promise<MonkeyTypes.Layout> {
  if (Object.keys(layoutsList).length === 0) {
    await getLayoutsList();
  }
  return layoutsList[layoutName];
}

type Font = { name: string; display?: string };

let fontsList: Font[] = [];
export async function getFontsList(): Promise<Font[]> {
  if (fontsList.length === 0) {
    return $.getJSON("fonts/_list.json", function (data) {
      fontsList = data.sort(function (a: Font, b: Font) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return fontsList;
    });
  } else {
    return fontsList;
  }
}

let supportersList: string[] = [];
export async function getSupportersList(): Promise<string[]> {
  if (supportersList.length === 0) {
    return $.getJSON("about/supporters.json", function (data) {
      supportersList = data;
      return supportersList;
    });
  } else {
    return supportersList;
  }
}

let contributorsList: string[] = [];
export async function getContributorsList(): Promise<string[]> {
  if (contributorsList.length === 0) {
    return $.getJSON("about/contributors.json", function (data) {
      contributorsList = data;
      return contributorsList;
    });
  } else {
    return contributorsList;
  }
}

let languageList: string[] = [];
export async function getLanguageList(): Promise<string[]> {
  if (languageList.length === 0) {
    return $.getJSON("languages/_list.json", function (data) {
      languageList = data;
      return languageList;
    });
  } else {
    return languageList;
  }
}

let languageGroupList: MonkeyTypes.LanguageGroup[] = [];
export async function getLanguageGroups(): Promise<
  MonkeyTypes.LanguageGroup[]
> {
  if (languageGroupList.length === 0) {
    return $.getJSON("languages/_groups.json", function (data) {
      languageGroupList = data;
      return languageGroupList;
    });
  } else {
    return languageGroupList;
  }
}

let currentLanguage: MonkeyTypes.LanguageObject;
export async function getLanguage(
  lang: string
): Promise<MonkeyTypes.LanguageObject> {
  try {
    if (currentLanguage == undefined || currentLanguage.name !== lang) {
      console.log("getting language json");
      await $.getJSON(`languages/${lang}.json`, function (data) {
        currentLanguage = data;
      });
    }
    return currentLanguage;
  } catch (e) {
    console.error(`error getting language`);
    console.error(e);
    await $.getJSON(`languages/english.json`, function (data) {
      currentLanguage = data;
    });
    return currentLanguage;
  }
}

export async function getCurrentLanguage(
  languageName: string
): Promise<MonkeyTypes.LanguageObject> {
  return await getLanguage(languageName);
}

export async function findCurrentGroup(
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

let challengeList: MonkeyTypes.Challenge[] = [];
export async function getChallengeList(): Promise<MonkeyTypes.Challenge[]> {
  if (challengeList.length === 0) {
    return $.getJSON("challenges/_list.json", function (data) {
      challengeList = data;
      return challengeList;
    });
  } else {
    return challengeList;
  }
}

export function smooth(
  arr: number[],
  windowSize: number,
  getter = (value: number): number => value
): number[] {
  const get = getter;
  const result = [];

  for (let i = 0; i < arr.length; i += 1) {
    const leftOffeset = i - windowSize;
    const from = leftOffeset >= 0 ? leftOffeset : 0;
    const to = i + windowSize + 1;

    let count = 0;
    let sum = 0;
    for (let j = from; j < to && j < arr.length; j += 1) {
      sum += get(arr[j]);
      count += 1;
    }

    result[i] = sum / count;
  }

  return result;
}

export function stdDev(array: number[]): number {
  try {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(
      array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
  } catch (e) {
    return 0;
  }
}

export function mean(array: number[]): number {
  try {
    return (
      array.reduce((previous, current) => (current += previous)) / array.length
    );
  } catch (e) {
    return 0;
  }
}

//https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
export function median(arr: number[]): number {
  try {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  } catch (e) {
    return 0;
  }
}

export async function getReleasesFromGitHub(): Promise<
  MonkeyTypes.GithubRelease[]
> {
  return $.getJSON(
    "https://api.github.com/repos/Miodec/monkeytype/releases",
    (data) => {
      $("#bottom .version .text").text(data[0].name);
      $("#bottom .version").css("opacity", 1);
      $("#versionHistory .releases").empty();
      data.forEach((release: MonkeyTypes.GithubRelease) => {
        if (!release.draft && !release.prerelease) {
          $("#versionHistory .releases").append(`
          <div class="release">
            <div class="title">${release.name}</div>
            <div class="date">${format(
              new Date(release.published_at),
              "dd MMM yyyy"
            )}</div>
            <div class="body">${release.body.replace(/\r\n/g, "<br>")}</div>
          </div>
        `);
        }
      });
    }
  );
}

// function getPatreonNames() {
//   let namesel = $(".pageAbout .section .supporters");
//   firebase
//     .functions()
//     .httpsCallable("getPatreons")()
//     .then((data) => {
//       let names = data.data;
//       names.forEach((name) => {
//         namesel.append(`<div>${name}</div>`);
//       });
//     });
// }

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

export function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function findLineByLeastSquares(values_y: number[]): number[][] {
  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_xx = 0;
  let count = 0;

  /*
   * We'll use those letiables for faster read/write access.
   */
  let x = 0;
  let y = 0;
  const values_length = values_y.length;

  /*
   * Nothing to do.
   */
  if (values_length === 0) {
    return [[], []];
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (let v = 0; v < values_length; v++) {
    x = v + 1;
    y = values_y[v];
    sum_x += x;
    sum_y += y;
    sum_xx += x * x;
    sum_xy += x * y;
    count++;
  }

  /*
   * Calculate m and b for the formular:
   * y = x * m + b
   */
  const m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
  const b = sum_y / count - (m * sum_x) / count;

  const returnpoint1 = [1, 1 * m + b];
  const returnpoint2 = [values_length, values_length * m + b];
  return [returnpoint1, returnpoint2];
}

export function getGibberish(): string {
  const randLen = randomIntFromRange(1, 7);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    ret += String.fromCharCode(97 + randomIntFromRange(0, 25));
  }
  return ret;
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
      if (days == 1) {
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
      if (hours == 1) {
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
      if (minutes == 1) {
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
      if (seconds == 1) {
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

export function getNumbers(len: number): string {
  const randLen = randomIntFromRange(1, len);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    const randomNum = randomIntFromRange(0, 9);
    ret += randomNum.toString();
  }
  return ret;
}

export function getSpecials(): string {
  const randLen = randomIntFromRange(1, 7);
  let ret = "";
  const specials = [
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "{",
    "}",
    "[",
    "]",
    "'",
    '"',
    "/",
    "\\",
    "|",
  ];
  for (let i = 0; i < randLen; i++) {
    ret += randomElementFromArray(specials);
  }
  return ret;
}

export function getASCII(): string {
  const randLen = randomIntFromRange(1, 10);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    let ran = 33 + randomIntFromRange(0, 93);
    while (ran == 96 || ran == 94) ran = 33 + randomIntFromRange(0, 93); //todo remove when input rewrite is fixed
    ret += String.fromCharCode(ran);
  }
  return ret;
}

export function getArrows(): string {
  const arrowArray = ["←", "↑", "→", "↓"];
  let arrowWord = "";
  let lastchar;
  for (let i = 0; i < 5; i++) {
    let random = randomElementFromArray(arrowArray);
    while (random === lastchar) {
      random = randomElementFromArray(arrowArray);
    }
    lastchar = random;
    arrowWord += random;
  }
  return arrowWord;
}

export function getPositionString(number: number): string {
  let numend = "th";
  const t = number % 10;
  const h = number % 100;
  if (t == 1 && h != 11) {
    numend = "st";
  }
  if (t == 2 && h != 12) {
    numend = "nd";
  }
  if (t == 3 && h != 13) {
    numend = "rd";
  }
  return number + numend;
}

export function findGetParameter(parameterName: string): string | null {
  let result = null;
  let tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
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
  interface Document {
    mozCancelFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitFullscreenElement?: Element;
  }
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
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      // @ts-ignore
      elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

export function getWords(): string {
  const words = [...document.querySelectorAll("#words .word")]
    .map((word) => {
      return [...word.querySelectorAll("letter")]
        .map((letter) => letter.textContent)
        .join("");
    })
    .join(" ");

  return words;
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
  if (/miodec/.test(name.toLowerCase())) return false;
  if (/bitly/.test(name.toLowerCase())) return false;
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
  CustomText: MonkeyTypes.CustomText
): boolean {
  if (
    (mode === "words" && words < 1000) ||
    (mode === "time" && time < 3600) ||
    mode === "quote" ||
    (mode === "custom" && CustomText.isWordRandom && CustomText.word < 1000) ||
    (mode === "custom" && CustomText.isTimeRandom && CustomText.time < 3600) ||
    (mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.text.length < 1000)
  ) {
    return true;
  } else {
    return false;
  }
}

export function clearTimeouts(timeouts: (number | NodeJS.Timeout)[]): void {
  timeouts.forEach((to) => {
    if (typeof to === "number") clearTimeout(to);
    else clearTimeout(to);
  });
}

//https://stackoverflow.com/questions/1431094/how-do-i-replace-a-character-at-a-particular-index-in-javascript
export function setCharAt(str: string, index: number, chr: string): string {
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

export function convertRGBtoHEX(rgb: string): string | undefined {
  const match: RegExpMatchArray | null = rgb.match(
    /^rgb\((\d+), \s*(\d+), \s*(\d+)\)$/
  );
  if (match === null) return;
  if (match.length < 3) return;
  function hexCode(i: string): string {
    // Take the last 2 characters and convert
    // them to Hexadecimal.

    return ("0" + parseInt(i).toString(16)).slice(-2);
  }
  return "#" + hexCode(match[1]) + hexCode(match[2]) + hexCode(match[3]);
}

interface LastIndex extends String {
  lastIndexOfRegex(regex: RegExp): number;
}

(String.prototype as LastIndex).lastIndexOfRegex = function (
  regex: RegExp
): number {
  const match = this.match(regex);
  return match ? this.lastIndexOf(match[match.length - 1]) : -1;
};

export const trailingComposeChars = /[\u02B0-\u02FF`´^¨~]+$|⎄.*$/;

//https://stackoverflow.com/questions/36532307/rem-px-in-javascript
export function convertRemToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function swapElements(
  el1: JQuery,
  el2: JQuery,
  totalDuration: number,
  callback = function (): void {
    return;
  },
  middleCallback = function (): void {
    return;
  }
): boolean | undefined {
  if (
    (el1.hasClass("hidden") && !el2.hasClass("hidden")) ||
    (!el1.hasClass("hidden") && el2.hasClass("hidden"))
  ) {
    //one of them is hidden and the other is visible
    if (el1.hasClass("hidden")) {
      callback();
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
        () => {
          middleCallback();
          $(el1).addClass("hidden");
          $(el2)
            .removeClass("hidden")
            .css("opacity", 0)
            .animate(
              {
                opacity: 1,
              },
              totalDuration / 2,
              () => {
                callback();
              }
            );
        }
      );
  } else if (el1.hasClass("hidden") && el2.hasClass("hidden")) {
    //both are hidden, only fade in the second
    $(el2)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        totalDuration,
        () => {
          callback();
        }
      );
  } else {
    callback();
  }

  return;
}

export function getMode2(
  config: MonkeyTypes.Config,
  randomQuote: MonkeyTypes.Quote
): string {
  const mode = config.mode;
  if (mode === "time") {
    return config.time.toString();
  } else if (mode === "words") {
    return config.words.toString();
  } else if (mode === "custom") {
    return "custom";
  } else if (mode === "zen") {
    return "zen";
  } else if (mode === "quote") {
    return randomQuote.id.toString();
  }

  return "";
}

export async function downloadResultsCSV(
  array: MonkeyTypes.Result<MonkeyTypes.Mode>[]
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
    ...array.map((item: MonkeyTypes.Result<MonkeyTypes.Mode>) => [
      item._id,
      item.isPb,
      item.wpm,
      item.acc,
      item.rawWpm,
      item.consistency,
      item.charStats.join(","),
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
      item.tags.join(","),
      item.timestamp,
    ]),
  ]
    .map((e) => e.join("|"))
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
 * Gets an integer between min and max, both are inclusive.
 * @param min
 * @param max
 * @returns Random integer betwen min and max.
 */
export function randomIntFromRange(min: number, max: number): number {
  const minNorm = Math.ceil(min);
  const maxNorm = Math.floor(max);
  return Math.floor(Math.random() * (maxNorm - minNorm + 1) + minNorm);
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
    elements[j] = elements[i];
    elements[i] = temp;
  }
}

export function randomElementFromArray<T>(array: T[]): T {
  return array[randomIntFromRange(0, array.length - 1)];
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

  if (objectWithMessage?.message) {
    return `${message}: ${objectWithMessage.message}`;
  }

  return message;
}
