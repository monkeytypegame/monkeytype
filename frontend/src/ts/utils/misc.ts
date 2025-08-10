import * as Loader from "../elements/loader";
import { envConfig } from "../constants/env-config";
import { lastElementFromArray } from "./arrays";
import { Config } from "@monkeytype/schemas/configs";
import { Mode, Mode2, PersonalBests } from "@monkeytype/schemas/shared";
import { Result } from "@monkeytype/schemas/results";
import { z } from "zod";

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
      // @ts-expect-error some code i found online
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

// TODO INVESTIGATE IF THIS IS NEEDED
// eslint-disable-next-line no-extend-native
(String.prototype as LastIndex).lastIndexOfRegex = function (
  regex: RegExp
): number {
  const match = this.match(regex);
  return match ? this.lastIndexOf(lastElementFromArray(match) as string) : -1;
};

export const trailingComposeChars = /[\u02B0-\u02FF`´^¨~]+$|⎄.*$/;

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
  totalDuration = applyReducedMotion(totalDuration);
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
  randomQuote: { id: number } | null
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

export async function downloadResultsCSV(array: Result<Mode>[]): Promise<void> {
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
    ...array.map((item) => [
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
      item.tags?.join(";"),
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

export function getErrorMessage(error: unknown): string | undefined {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    (typeof error.message === "string" || typeof error.message === "number")
  ) {
    message = `${error.message}`;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "number") {
    message = `${error}`;
  }

  if (message === "") {
    return undefined;
  }

  return message;
}

export function createErrorMessage(error: unknown, message: string): string {
  const errorMessage = getErrorMessage(error);

  if (errorMessage === undefined) {
    console.error("Could not get error message from error", error);
    return `${message}: Unknown error`;
  }

  return `${message}: ${errorMessage}`;
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
    el.animate(animation, applyReducedMotion(duration), easing, resolve);
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function deepClone<T>(obj: T[]): T[];
export function deepClone<T extends object>(obj: T): T;
export function deepClone<T>(obj: T): T;
export function deepClone<T>(obj: T | T[]): T | T[] {
  // Check if the value is a primitive (not an object or array)
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  // Handle objects
  const clonedObj = {} as { [K in keyof T]: T[K] };

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone((obj as { [K in keyof T]: T[K] })[key]);
    }
  }

  return clonedObj;
}

export function prefersReducedMotion(): boolean {
  return matchMedia?.("(prefers-reduced-motion)")?.matches;
}

/**
 * Reduce the animation time based on the browser preference `prefers-reduced-motion`.
 * @param animationTime
 * @returns `0` if user prefers reduced-motion, else the given animationTime
 */
export function applyReducedMotion(animationTime: number): number {
  return prefersReducedMotion() ? 0 : animationTime;
}

/**
 * Creates a promise with resolvers.
 * This is useful for creating a promise that can be resolved or rejected from outside the promise itself.
 */
export function promiseWithResolvers<T = void>(): {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<T>;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
}

/**
 * Wrap a function so only one call runs at a time. While a call is running, new
 * calls will not run and only the latest one will be queued, any prior queued
 * calls are skipped. Once the running call finishes, the queued call runs.
 * @param fn the function to debounce
 * @param options - `rejectSkippedCalls`: if false, promises returned by skipped
 * calls will be resolved to null, otherwise will be rejected (defaults to true).
 * @returns debounced version of the original function. This debounced function
 * returns a promise that resolves to the original return value. Promises of skipped
 * calls will be rejected, (or resolved to null if `options.rejectSkippedCalls` was false).
 */
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options?: { rejectSkippedCalls?: true }
): (...args: TArgs) => Promise<TResult>;
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: { rejectSkippedCalls: false }
): (...args: TArgs) => Promise<TResult | null>;
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  { rejectSkippedCalls = true }: { rejectSkippedCalls?: boolean } = {}
): (...args: TArgs) => Promise<TResult | null> {
  let isLocked = false;
  let next: {
    args: TArgs;
    resolve: (value: TResult | null) => void;
    reject: (reason?: unknown) => void;
  } | null = null;

  async function run(...args: TArgs): Promise<TResult> {
    isLocked = true;
    try {
      return await Promise.resolve(fn(...args));
    } finally {
      isLocked = false;

      const queued = next;
      next = null;
      if (queued) run(...queued.args).then(queued.resolve, queued.reject);
    }
  }

  return async function debounced(...args: TArgs): Promise<TResult | null> {
    if (isLocked) {
      // drop previously queued call
      if (next) {
        if (rejectSkippedCalls) {
          next.reject(
            new Error("skipped call: call was superseded by a more recent one")
          );
        } else {
          next.resolve(null);
        }
      }

      // queue the new call
      return new Promise<TResult | null>((resolve, reject) => {
        next = { args, resolve, reject };
      });
    }
    // no running instances, run immediately
    return run(...args);
  };
}

/**
 * Sanitize object. Remove invalid values based on the schema.
 * @param schema zod schema
 * @param obj object
 * @returns sanitized object
 */
export function sanitize<T extends z.ZodTypeAny>(
  schema: T,
  obj: z.infer<T>
): z.infer<T> {
  const validate = schema.safeParse(obj);

  if (validate.success) {
    //use the parsed data, not the obj. keys might been removed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return validate.data;
  }

  const errors: Map<string, number[] | undefined> = new Map();
  for (const error of validate.error.errors) {
    const element = error.path[0] as string;
    let val = errors.get(element);
    if (typeof error.path[1] === "number") {
      val = [...(val ?? []), error.path[1]];
    } else if (error.path.length > 1) {
      throw new Error(
        "sanitize does not support nested objects yet. path: " +
          error.path.join(".")
      );
    }
    errors.set(element, val);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const cleanedObject = Object.fromEntries(
    Object.entries(obj)
      .map(([key, value]) => {
        if (!errors.has(key)) {
          return [key, value];
        }

        const error = errors.get(key);

        if (
          Array.isArray(value) &&
          error !== undefined && //error is not on the array itself
          error.length < value.length //not all items in the array are invalid
        ) {
          //some items of the array are invalid
          const cleanedArray = value.filter(
            (_element, index) => !error.includes(index)
          );
          const cleanedArrayValidation = schema.safeParse(
            Object.fromEntries([[key, cleanedArray]])
          );
          if (cleanedArrayValidation.success) {
            return [key, cleanedArray];
          } else {
            return [key, undefined];
          }
        } else {
          return [key, undefined];
        }
      })
      .filter((it) => it[1] !== undefined)
  ) as z.infer<T>;

  const cleanValidate = schema.safeParse(cleanedObject);
  if (cleanValidate.success) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return cleanValidate.data;
  }

  const errorsString = cleanValidate.error.errors
    .map((e) => e.path.join(".") + ": " + e.message)
    .join(", ");
  throw new Error("unable to sanitize: " + errorsString);
}

export function triggerResize(): void {
  $(window).trigger("resize");
}
// DO NOT ALTER GLOBAL OBJECTSONSTRUCTOR, IT WILL BREAK RESULT HASHES
