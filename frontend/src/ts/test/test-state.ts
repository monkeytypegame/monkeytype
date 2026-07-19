import { promiseWithResolvers } from "../utils/misc";
import { EventLog } from "./events/types";

export let selectedQuoteId =
  parseInt(localStorage.getItem("selectedQuoteId") ?? "1", 10) || 1;
export let isLanguageRightToLeft = false;
export let isDirectionReversed = false;
export let testRestarting = false;
export let resultVisible = false;
export let koreanStatus = false;
export let lastEventLog: EventLog | null = null;

export function setLastEventLog(log: EventLog): void {
  lastEventLog = log;
}

export function setKoreanStatus(val: boolean): void {
  koreanStatus = val;
}

export function setSelectedQuoteId(id: number): void {
  selectedQuoteId = id;
  localStorage.setItem("selectedQuoteId", id.toString());
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
