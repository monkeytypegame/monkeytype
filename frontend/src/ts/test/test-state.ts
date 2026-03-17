import { Challenge } from "@monkeytype/schemas/challenges";
import { promiseWithResolvers } from "../utils/misc";

export let isRepeated = false;
export let isPaceRepeat = false;
export let isActive = false;
export let activeChallenge: null | Challenge = null;
export let bailedOut = false;
export let selectedQuoteId = 1;
export let activeWordIndex = 0;
export let testInitSuccess = true;
export let isLanguageRightToLeft = false;
export let isDirectionReversed = false;
export let testRestarting = false;
export let resultVisible = false;

export function setRepeated(tf: boolean): void {
  isRepeated = tf;
}

export function setPaceRepeat(tf: boolean): void {
  isPaceRepeat = tf;
}

export function setActive(tf: boolean): void {
  isActive = tf;
}

export function setActiveChallenge(val: null | Challenge): void {
  activeChallenge = val;
}

export function setBailedOut(tf: boolean): void {
  bailedOut = tf;
}

export function setSelectedQuoteId(id: number): void {
  selectedQuoteId = id;
}

export function setActiveWordIndex(index: number): void {
  activeWordIndex = index;
}

export function increaseActiveWordIndex(): void {
  activeWordIndex++;
}

export function decreaseActiveWordIndex(): void {
  activeWordIndex--;
}

export function setTestInitSuccess(tf: boolean): void {
  testInitSuccess = tf;
}

export function setIsLanguageRightToLeft(rtl: boolean): void {
  isLanguageRightToLeft = rtl;
}

export function setIsDirectionReversed(val: boolean): void {
  isDirectionReversed = val;
}

const {
  promise: testRestartingPromise,
  resolve: restartingResolve,
  reset: resetTestRestarting,
} = promiseWithResolvers();

export { testRestartingPromise };

export function setTestRestarting(val: boolean): void {
  testRestarting = val;
  if (val) {
    resetTestRestarting();
  } else {
    restartingResolve();
  }
}

export function setResultVisible(val: boolean): void {
  resultVisible = val;
}
