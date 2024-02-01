import * as Loader from "../elements/loader";
import { normal as normalBlend } from "color-blend";
import { envConfig } from "../constants/env-config";

async function fetchJson<T>(url: string): Promise<T> {
  try {
    if (!url) throw new Error("No URL");
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    } else {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (e) {
    console.error("Error fetching JSON: " + url, e);
    throw e;
  }
}

export const cachedFetchJson = memoizeAsync<string, typeof fetchJson>(
  fetchJson
);

export async function getLayoutsList(): Promise<MonkeyTypes.Layouts> {
  try {
    const layoutsList = await cachedFetchJson<MonkeyTypes.Layouts>(
      "/./layouts/_list.json"
    );
    return layoutsList;
  } catch (e) {
    throw new Error("Layouts JSON fetch failed");
  }
}

/**
 * @throws {Error} If layout list or layout doesnt exist.
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
export async function getThemesList(): Promise<MonkeyTypes.Theme[]> {
  if (!themesList) {
    let themes = await cachedFetchJson<MonkeyTypes.Theme[]>(
      "/./themes/_list.json"
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

export async function getLanguageList(): Promise<string[]> {
  try {
    const languageList = await cachedFetchJson<string[]>(
      "/./languages/_list.json"
    );
    return languageList;
  } catch (e) {
    throw new Error("Language list JSON fetch failed");
  }
}

export async function getLanguageGroups(): Promise<
  MonkeyTypes.LanguageGroup[]
> {
  try {
    const languageGroupList = await cachedFetchJson<
      MonkeyTypes.LanguageGroup[]
    >("/./languages/_groups.json");
    return languageGroupList;
  } catch (e) {
    throw new Error("Language groups JSON fetch failed");
  }
}

let currentLanguage: MonkeyTypes.LanguageObject;
export async function getLanguage(
  lang: string
): Promise<MonkeyTypes.LanguageObject> {
  // try {
  if (currentLanguage === undefined || currentLanguage.name !== lang) {
    currentLanguage = await cachedFetchJson<MonkeyTypes.LanguageObject>(
      `/./languages/${lang}.json`
    );
  }
  return currentLanguage;
  // } catch (e) {
  //   console.error(`error getting language`);
  //   console.error(e);
  //   currentLanguage = await cachedFetchJson<MonkeyTypes.LanguageObject>(
  //     `/./language/english.json`
  //   );
  //   return currentLanguage;
  // }
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

let funboxList: MonkeyTypes.FunboxMetadata[] | undefined;
export async function getFunboxList(): Promise<MonkeyTypes.FunboxMetadata[]> {
  if (!funboxList) {
    let list = await cachedFetchJson<MonkeyTypes.FunboxMetadata[]>(
      "/./funbox/_list.json"
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

export async function getFunbox(
  funbox: string
): Promise<MonkeyTypes.FunboxMetadata | undefined> {
  const list: MonkeyTypes.FunboxMetadata[] = await getFunboxList();
  return list.find(function (element) {
    return element.name === funbox;
  });
}

let fontsList: MonkeyTypes.FontObject[] | undefined;
export async function getFontsList(): Promise<MonkeyTypes.FontObject[]> {
  if (!fontsList) {
    let list = await cachedFetchJson<MonkeyTypes.FontObject[]>(
      "/./fonts/_list.json"
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

export async function getChallengeList(): Promise<MonkeyTypes.Challenge[]> {
  try {
    const data = await cachedFetchJson<MonkeyTypes.Challenge[]>(
      "/./challenges/_list.json"
    );
    return data;
  } catch (e) {
    throw new Error("Challenge list JSON fetch failed");
  }
}

export async function getSupportersList(): Promise<string[]> {
  try {
    const data = await cachedFetchJson<string[]>("/./about/supporters.json");
    return data;
  } catch (e) {
    throw new Error("Supporters list JSON fetch failed");
  }
}

export async function getContributorsList(): Promise<string[]> {
  try {
    const data = await cachedFetchJson<string[]>("/./about/contributors.json");
    return data;
  } catch (e) {
    throw new Error("Contributors list JSON fetch failed");
  }
}

export function blendTwoHexColors(
  color1: string,
  color2: string,
  opacity: number
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (rgb1 && rgb2) {
    const rgba1 = {
      r: rgb1.r,
      g: rgb1.g,
      b: rgb1.b,
      a: 1,
    };
    const rgba2 = {
      r: rgb2.r,
      g: rgb2.g,
      b: rgb2.b,
      a: opacity,
    };
    const blended = normalBlend(rgba1, rgba2);
    return rgbToHex(blended.r, blended.g, blended.b);
  } else {
    return "#000000";
  }
}

function hexToRgb(hex: string):
  | {
      r: number;
      g: number;
      b: number;
    }
  | undefined {
  if (hex.length !== 4 && hex.length !== 7 && !hex.startsWith("#")) {
    return undefined;
  }
  let r: number;
  let g: number;
  let b: number;
  if (hex.length === 4) {
    r = ("0x" + hex[1] + hex[1]) as unknown as number;
    g = ("0x" + hex[2] + hex[2]) as unknown as number;
    b = ("0x" + hex[3] + hex[3]) as unknown as number;
  } else if (hex.length === 7) {
    r = ("0x" + hex[1] + hex[2]) as unknown as number;
    g = ("0x" + hex[3] + hex[4]) as unknown as number;
    b = ("0x" + hex[5] + hex[6]) as unknown as number;
  } else {
    return undefined;
  }

  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
  if (hex.length === 4) {
    r = ("0x" + hex[1] + hex[1]) as unknown as number;
    g = ("0x" + hex[2] + hex[2]) as unknown as number;
    b = ("0x" + hex[3] + hex[3]) as unknown as number;
  } else if (hex.length === 7) {
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

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
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
      sum += get(arr[j] as number);
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
    return arr.length % 2 !== 0
      ? (nums[mid] as number)
      : ((nums[mid - 1] as number) + (nums[mid] as number)) / 2;
  } catch (e) {
    return 0;
  }
}

export async function getLatestReleaseFromGitHub(): Promise<string> {
  const releases = await $.getJSON(
    "https://api.github.com/repos/monkeytypegame/monkeytype/releases?per_page=1"
  );
  return releases[0].name;
}

export async function getReleasesFromGitHub(): Promise<
  MonkeyTypes.GithubRelease[]
> {
  return $.getJSON(
    "https://api.github.com/repos/monkeytypegame/monkeytype/releases?per_page=5"
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

export function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function findLineByLeastSquares(
  values_y: number[]
): [[number, number], [number, number]] | null {
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
    return null;
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (let v = 0; v < values_length; v++) {
    x = v + 1;
    y = values_y[v] as number;
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

  const returnpoint1 = [1, 1 * m + b] as [number, number];
  const returnpoint2 = [values_length, values_length * m + b] as [
    number,
    number
  ];
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

export function getNumbers(len: number): string {
  const randLen = randomIntFromRange(1, len);
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    let randomNum;
    if (i === 0) {
      randomNum = randomIntFromRange(1, 9);
    } else {
      randomNum = randomIntFromRange(0, 9);
    }
    ret += randomNum.toString();
  }
  return ret;
}

//convert numbers to arabic-indic
export function convertNumberToArabic(numString: string): string {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  let ret = "";
  for (let i = 0; i < numString.length; i++) {
    ret += arabicIndic[parseInt(numString[i] as string)];
  }
  return ret;
}

export function convertNumberToNepali(numString: string): string {
  const nepaliIndic = "०१२३४५६७८९";
  let ret = "";
  for (let i = 0; i < numString.length; i++) {
    ret += nepaliIndic[parseInt(numString[i] as string)];
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
    "?",
    ";",
    ":",
    ">",
    "<",
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
    const ran = 33 + randomIntFromRange(0, 93);
    ret += String.fromCharCode(ran);
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

export function getPositionString(number: number): string {
  let numend = "th";
  const t = number % 10;
  const h = number % 100;
  if (t === 1 && h !== 11) {
    numend = "st";
  }
  if (t === 2 && h !== 12) {
    numend = "nd";
  }
  if (t === 3 && h !== 13) {
    numend = "rd";
  }
  return number + numend;
}

export function findGetParameter(
  parameterName: string,
  getOverride?: string
): string | null {
  let result = null;
  let tmp = [];

  let search = location.search;
  if (getOverride) {
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
  if (getOverride) {
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
  CustomText: SharedTypes.CustomText,
  customTextIsLong: boolean
): boolean {
  const wordsLong = mode === "words" && (words >= 1000 || words === 0);
  const timeLong = mode === "time" && (time >= 900 || time === 0);
  const customTextLong = mode === "custom" && customTextIsLong === true;
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
  return (
    "#" +
    hexCode(match[1] as string) +
    hexCode(match[2] as string) +
    hexCode(match[3] as string)
  );
}

interface LastIndex extends String {
  lastIndexOfRegex(regex: RegExp): number;
}

(String.prototype as LastIndex).lastIndexOfRegex = function (
  regex: RegExp
): number {
  const match = this.match(regex);
  return match ? this.lastIndexOf(match[match.length - 1] as string) : -1;
};

export const trailingComposeChars = /[\u02B0-\u02FF`´^¨~]+$|⎄.*$/;

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
              () => {
                callback();
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
  config: MonkeyTypes.Config,
  randomQuote: MonkeyTypes.Quote | null
): SharedTypes.Mode2<M> {
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

  return retVal as SharedTypes.Mode2<M>;
}

export async function downloadResultsCSV(
  array: SharedTypes.Result<SharedTypes.Mode>[]
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
    ...array.map((item: SharedTypes.Result<SharedTypes.Mode>) => [
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

  if (objectWithMessage?.message) {
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
  const popups = document.querySelectorAll("#popups .popupWrapper");
  let popupVisible = false;
  for (const popup of popups) {
    if (isPopupVisible(popup.id)) {
      popupVisible = true;
      break;
    }
  }
  return popupVisible;
}

export async function getDiscordAvatarUrl(
  discordId?: string,
  discordAvatar?: string,
  discordAvatarSize = 32
): Promise<string | null> {
  if (!discordId || !discordAvatar) {
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

export function getLevel(xp: number): number {
  return (1 / 98) * (-151 + Math.sqrt(392 * xp + 22801)) + 1;
}

export function getXpForLevel(level: number): number {
  return 49 * (level - 1) + 100;
}

export async function promiseAnimation(
  el: JQuery<HTMLElement>,
  animation: Record<string, string>,
  duration: number,
  easing: string
): Promise<void> {
  return new Promise((resolve) => {
    el.animate(animation, duration, easing, resolve);
  });
}

//abbreviateNumber
export function abbreviateNumber(num: number, decimalPoints = 1): string {
  if (num < 1000) {
    return num.toString();
  }

  const exp = Math.floor(Math.log(num) / Math.log(1000));
  const pre = "kmbtqQsSond".charAt(exp - 1);
  return (num / Math.pow(1000, exp)).toFixed(decimalPoints) + pre;
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
    return b.indexOf(e) > -1;
  });
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}

export function htmlToText(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent || el.innerText || "";
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

export function getBinary(): string {
  const ret = Math.floor(Math.random() * 256).toString(2);
  return ret.padStart(8, "0");
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
  const lang = await getLanguage(language);
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
export function convertToMorse(word: string): string {
  const morseCode: { [id: string]: string } = {
    a: ".-",
    b: "-...",
    c: "-.-.",
    d: "-..",
    e: ".",
    f: "..-.",
    g: "--.",
    h: "....",
    i: "..",
    j: ".---",
    k: "-.-",
    l: ".-..",
    m: "--",
    n: "-.",
    o: "---",
    p: ".--.",
    q: "--.-",
    r: ".-.",
    s: "...",
    t: "-",
    u: "..-",
    v: "...-",
    w: ".--",
    x: "-..-",
    y: "-.--",
    z: "--..",
    "0": "-----",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    ".": ".-.-.-",
    ",": "--..--",
    "?": "..--..",
    "'": ".----.",
    "/": "-..-.",
    "(": "-.--.",
    ")": "-.--.-",
    "&": ".-...",
    ":": "---...",
    ";": "-.-.-.",
    "=": "-...-",
    "+": ".-.-.",
    "-": "-....-",
    _: "..--.-",
    '"': ".-..-.",
    $: "...-..-",
    "!": "-.-.--",
    "@": ".--.-.",
  };

  let morseWord = "";

  const deAccentedWord = replaceSpecialChars(word);
  for (let i = 0; i < deAccentedWord.length; i++) {
    const letter = morseCode[deAccentedWord.toLowerCase()[i] as string];
    morseWord += letter ? letter + "/" : "";
  }
  return morseWord;
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

  if (!title) {
    document.title =
      local + "Monkeytype | A minimalistic, customizable typing test";
  } else {
    document.title = local + title;
  }
}

export function getNumberWithMagnitude(num: number): {
  rounded: number;
  roundedTo2: number;
  orderOfMagnitude: string;
} {
  const units = [
    "",
    "thousand",
    "million",
    "billion",
    "trillion",
    "quadrillion",
    "quintillion",
    "sextillion",
    "septillion",
    "octillion",
    "nonillion",
    "decillion",
  ];
  let unitIndex = 0;
  let roundedNum = num;

  while (roundedNum >= 1000) {
    roundedNum /= 1000;
    unitIndex++;
  }

  const unit = units[unitIndex] ? (units[unitIndex] as string) : "unknown";

  return {
    rounded: Math.round(roundedNum),
    roundedTo2: roundTo2(roundedNum),
    orderOfMagnitude: unit,
  };
}

export function numberWithSpaces(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function lastElementFromArray<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

// DO NOT ALTER GLOBAL OBJECTSONSTRUCTOR, IT WILL BREAK RESULT HASHES
