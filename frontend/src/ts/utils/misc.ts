import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import { envConfig } from "virtual:env-config";
import { lastElementFromArray } from "./arrays";
import { Config } from "@monkeytype/schemas/configs";
import { Mode, Mode2, PersonalBests } from "@monkeytype/schemas/shared";
import { Result } from "@monkeytype/schemas/results";
import { RankAndCount } from "@monkeytype/schemas/users";
import { roundTo2 } from "@monkeytype/util/numbers";
import { animate, AnimationParams } from "animejs";
import { ElementWithUtils } from "./dom";

export function whorf(speed: number, wordlen: number): number {
  return Math.min(
    speed,
    Math.floor(speed * Math.pow(1.03, -2 * (wordlen - 3))),
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
  getOverride?: string,
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
      if (tmp[0] === parameterName) {
        result = decodeURIComponent(tmp[1] as string);
      }
    });
  return result;
}

export function checkIfGetParameterExists(
  parameterName: string,
  getOverride?: string,
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
  obj: Record<string, T | T[]>,
): string {
  const str = [];
  for (const p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      // Arrays get encoded as a comma(%2C)-separated list
      str.push(
        encodeURIComponent(p) +
          "=" +
          encodeURIComponent(obj[p] as unknown as T),
      );
    }
  }
  return str.join("&");
}

export function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    void document.documentElement.requestFullscreen();
  } else {
    void document.exitFullscreen();
  }
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeHTML<T extends string | null | undefined>(str: T): T {
  if (str === null || str === undefined) {
    return str;
  }

  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
  };

  return str.replace(/[&<>"'/`]/g, (char) => escapeMap[char] as string) as T;
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
  startpos: number,
): number {
  const indexOf = string.substring(startpos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf;
}

type LastIndex = {
  lastIndexOfRegex(regex: RegExp): number;
} & string;

(String.prototype as LastIndex).lastIndexOfRegex = function (
  regex: RegExp,
): number {
  const match = this.match(regex);
  return match ? this.lastIndexOf(lastElementFromArray(match) as string) : -1;
};

export const trailingComposeChars = /[\u02B0-\u02FF`´^¨~]+$|⎄.*$/;

export async function swapElements(
  el1: ElementWithUtils | null,
  el2: ElementWithUtils | null,
  totalDuration: number,
  callback = async function (): Promise<void> {
    return Promise.resolve();
  },
  middleCallback = async function (): Promise<void> {
    return Promise.resolve();
  },
): Promise<boolean | undefined> {
  if (el1 === null || el2 === null) {
    return;
  }

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

    el1.show();
    await el1.promiseAnimate({
      opacity: [1, 0],
      duration: totalDuration / 2,
    });
    el1.hide();
    await middleCallback();
    el2.show();
    await el2.promiseAnimate({
      opacity: [0, 1],
      duration: totalDuration / 2,
    });
    await callback();
  } else if (el1.hasClass("hidden") && el2.hasClass("hidden")) {
    //both are hidden, only fade in the second
    await middleCallback();

    el2.show();
    await el2.promiseAnimate({
      opacity: [0, 1],
      duration: totalDuration / 2,
    });

    await callback();
  } else {
    await middleCallback();
    await callback();
  }

  return;
}

export function getMode2<M extends keyof PersonalBests>(
  config: Config,
  randomQuote: { id: number } | null,
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
  showLoaderBar();
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
  hideLoaderBar();
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
  return (
    isElementVisible(`#popups #${popupId}`) ||
    isElementVisible(`#solidmodals #${popupId}`)
  );
}

export function isAnyPopupVisible(): boolean {
  const popups = document.querySelectorAll(
    "#popups .popupWrapper, #popups .backdrop, #popups .modalWrapper, #solidmodals dialog",
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

export async function promiseAnimate(
  el: HTMLElement | string,
  options: AnimationParams,
): Promise<void> {
  return new Promise((resolve) => {
    animate(el, {
      ...options,
      onComplete: (self, e) => {
        options.onComplete?.(self, e);
        resolve();
      },
    });
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPasswordStrong(password: string): boolean {
  const hasCapital = !!/[A-Z]/.exec(password);
  const hasNumber = !!/[\d]/.exec(password);
  const hasSpecial = !!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.exec(password);
  const isLong = password.length >= 8;
  const isShort = password.length <= 64;
  return hasCapital && hasNumber && hasSpecial && isLong && isShort;
}

export function htmlToText(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent || el.innerText || "";
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
  obj: T,
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
 * The returned promise reference stays constant even after reset() - it will always await the current internal promise.
 * Note: Promise chains created via .then()/.catch()/.finally() will always follow the current internal promise state, even if created before reset().
 */
export function promiseWithResolvers<T = void>(): {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<T>;
  reset: () => void;
} {
  let innerResolve!: (value: T) => void;
  let innerReject!: (reason?: unknown) => void;
  let currentPromise = new Promise<T>((res, rej) => {
    innerResolve = res;
    innerReject = rej;
  });

  /**
   * This was fully AI generated to make the reset function work. Black magic, but its unit-tested and works.
   */

  const promiseLike = {
    // oxlint-disable-next-line no-thenable promise-function-async require-await
    async then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | null,
    ): Promise<TResult1 | TResult2> {
      return currentPromise.then(onfulfilled, onrejected);
    },
    async catch<TResult = never>(
      onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
    ): Promise<T | TResult> {
      return currentPromise.catch(onrejected);
    },
    async finally(onfinally?: (() => void) | null): Promise<T> {
      return currentPromise.finally(onfinally);
    },
    [Symbol.toStringTag]: "Promise" as const,
  };

  const reset = (): void => {
    currentPromise = new Promise<T>((res, rej) => {
      innerResolve = res;
      innerReject = rej;
    });
  };

  // Wrapper functions that always call the current resolver/rejecter
  const resolve = (value: T): void => {
    innerResolve(value);
  };

  const reject = (reason?: unknown): void => {
    innerReject(reason);
  };

  return {
    resolve,
    reject,
    promise: promiseLike as Promise<T>,
    reset,
  };
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
  options?: { rejectSkippedCalls?: true },
): (...args: TArgs) => Promise<TResult>;
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: { rejectSkippedCalls: false },
): (...args: TArgs) => Promise<TResult | null>;
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  { rejectSkippedCalls = true }: { rejectSkippedCalls?: boolean } = {},
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
            new Error("skipped call: call was superseded by a more recent one"),
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

export function triggerResize(): void {
  window.dispatchEvent(new Event("resize"));
}

export type RequiredProperties<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

function isPlatform(searchTerm: string | RegExp): boolean {
  // oxlint-disable-next-line no-deprecated
  const platform = navigator.platform;
  if (typeof searchTerm === "string") {
    return platform.includes(searchTerm);
  } else {
    return searchTerm.test(platform);
  }
}

//function isWindows(): boolean {
//return isPlatform("Win");
//}

//function isLinux(): boolean {
//return isPlatform("Linux");
//}

//function isMac(): boolean {
//return isPlatform("Mac");
//}

export function isMacLike(): boolean {
  return isPlatform(/Mac|iPod|iPhone|iPad/);
}

export function scrollToCenterOrTop(el: HTMLElement | null): void {
  if (!el) return;

  const elementHeight = el.offsetHeight;
  const windowHeight = window.innerHeight;

  el.scrollIntoView({
    block: elementHeight < windowHeight ? "center" : "start",
  });
}

export function formatTopPercentage(lbRank: RankAndCount): string {
  if (lbRank.rank === undefined) return "-";
  if (lbRank.rank === 1) return "GOAT";
  return "Top " + roundTo2((lbRank.rank / lbRank.count) * 100) + "%";
}

export function formatTypingStatsRatio(stats: {
  startedTests?: number;
  completedTests?: number;
}): {
  completedPercentage: string;
  restartRatio: string;
} {
  if (stats.completedTests === undefined || stats.startedTests === undefined) {
    return { completedPercentage: "", restartRatio: "" };
  }
  return {
    completedPercentage: Math.floor(
      (stats.completedTests / stats.startedTests) * 100,
    ).toString(),
    restartRatio: (
      (stats.startedTests - stats.completedTests) /
      stats.completedTests
    ).toFixed(1),
  };
}

export function addToGlobal(items: Record<string, unknown>): void {
  for (const [name, item] of Object.entries(items)) {
    //@ts-expect-error dev
    window[name] = item;
  }
}

export function getTotalInlineMargin(element: HTMLElement): number {
  const computedStyle = window.getComputedStyle(element);
  return (
    parseInt(computedStyle.marginRight) + parseInt(computedStyle.marginLeft)
  );
}

// DO NOT ALTER GLOBAL OBJECTSONSTRUCTOR, IT WILL BREAK RESULT HASHES
