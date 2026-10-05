import * as Hangul from "hangul-js";
import { createSignal } from "solid-js";
import { z } from "zod";

import { Config } from "../config/store";
import * as ResultWordHighlight from "../components/pages/test/result/result-word-highlight";
import {
  getKoreanStatus,
  getLastEventLog,
  getResultVisible,
} from "../states/test";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../states/notifications";
import { showSimpleModal } from "../states/simple-modal";
import * as Strings from "../utils/strings";
import * as CustomText from "./custom-text";
import {
  getCorrectedWordsHistory,
  getInputHistory,
  getMissedWords,
  getWordBurstHistory,
} from "./events/stats";
import * as TestWords from "./test-words";
import { EventLog } from "./events/types";

const [isWordsHistoryOpen, setWordsHistoryOpen] = createSignal(false);
const [isWordsHistoryAnimated, setWordsHistoryAnimated] = createSignal(true);

export { isWordsHistoryOpen, isWordsHistoryAnimated };

export function closeResultWords(): void {
  setWordsHistoryOpen(false);
}

export type HistoryLetter = {
  char: string;
  state?: "correct" | "corrected" | "incorrect";
  extra?: boolean;
  extraCorrected?: boolean;
};

export type HistoryWord = {
  // what the user typed, spaces replaced with underscores. Read by result-word-highlight.
  input: string;
  burst?: number;
  error: boolean;
  letters: HistoryLetter[];
};

function stripCommit(str: string | undefined): string | undefined {
  if (str?.endsWith(" ") || str?.endsWith("\n")) return str.slice(0, -1);
  return str;
}

function buildWordLetters(
  rawInput: string | undefined,
  rawCorrected: string | undefined,
  rawTarget: string | undefined,
): HistoryLetter[] {
  const out: HistoryLetter[] = [];
  // the trailing commit separator (space/newline) is structural, not a letter;
  // strip it from all three so it never renders and over-typed extras / untyped
  // tails line up correctly
  const input = stripCommit(rawInput);
  const corrected = stripCommit(rawCorrected);
  const targetWord = stripCommit(rawTarget);

  const inputChars = Strings.splitIntoCharacters(input ?? "");
  const targetChars = Strings.splitIntoCharacters(targetWord ?? "");
  const correctedChars = Strings.splitIntoCharacters(corrected ?? "");
  const historyWord: string = !getKoreanStatus()
    ? (corrected ?? "")
    : Hangul.assemble((corrected ?? "").split(""));

  for (let c = 0; c < Math.max(targetChars.length, inputChars.length); c++) {
    const inputChar = inputChars[c];
    const targetChar = targetChars[c];
    const correctedChar = correctedChars[c];

    const extraCorrected =
      c >= targetChars.length - 1 &&
      c + 1 === inputChars.length &&
      historyWord.length > inputChars.length;

    let displayLetter = inputChar ?? targetChar ?? "";
    if (displayLetter === " ") {
      displayLetter = "_";
    }

    if (Config.mode === "zen" || targetChar !== undefined) {
      if (Config.mode === "zen" || inputChar === targetChar) {
        if (correctedChar === inputChar || correctedChar === undefined) {
          out.push({ char: displayLetter, state: "correct", extraCorrected });
        } else {
          out.push({ char: displayLetter, state: "corrected", extraCorrected });
        }
      } else if (inputChar === undefined) {
        out.push({ char: targetChar ?? "" });
      } else {
        out.push({
          char: targetChar ?? "",
          state: "incorrect",
          extraCorrected,
        });
      }
    } else {
      out.push({ char: displayLetter, state: "incorrect", extra: true });
    }
  }
  return out;
}

export function buildWordsHistory(eventLog: EventLog): HistoryWord[] {
  const inputHistory = getInputHistory(eventLog);
  const burstHistory = getWordBurstHistory(eventLog);
  const correctedHistory = getCorrectedWordsHistory(eventLog);

  const isTimedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
    (Config.mode === "custom" && CustomText.getLimitValue() === 0);

  const words: HistoryWord[] = [];
  const inputHistoryLength = inputHistory.length;
  for (let i = 0; i < inputHistoryLength + 2; i++) {
    const input = inputHistory[i];
    const target = TestWords.words.get(i)?.textWithCommit ?? "";
    const corrected = getKoreanStatus()
      ? Hangul.assemble((correctedHistory[i] ?? "").split(""))
      : correctedHistory[i];

    const isLastWord = i === inputHistoryLength - 1;
    const isPartiallyCorrect = target.startsWith(input ?? "");
    const shouldShowError =
      Config.mode !== "zen" &&
      !(isLastWord && isTimedTest && isPartiallyCorrect) &&
      input !== undefined &&
      input !== "";

    let inputAttribute = input ?? "";
    if (corrected !== undefined && corrected !== "") {
      inputAttribute = corrected;
    }
    if (
      inputAttribute.length >= target.length &&
      (inputAttribute.endsWith(" ") || inputAttribute.endsWith("\n"))
    ) {
      inputAttribute = inputAttribute.slice(0, -1);
    }

    words.push({
      input: inputAttribute.replace(/ /g, "_"),
      burst: burstHistory[i],
      error: input !== target && shouldShowError,
      letters: buildWordLetters(input, corrected, target),
    });
  }
  return words;
}

export function toggleResultWords(noAnimation = false): void {
  if (!getResultVisible()) return;
  ResultWordHighlight.updateToggleWordsHistoryTime();

  const open = !isWordsHistoryOpen();
  setWordsHistoryAnimated(!open || !noAnimation);
  setWordsHistoryOpen(open);
}

export async function copyWordsList(): Promise<void> {
  const eventLog = getLastEventLog();
  if (eventLog === null) return;
  let words;
  if (Config.mode === "zen") {
    words = getInputHistory(eventLog).join("");
  } else {
    words = TestWords.words
      .get()
      .slice(0, getInputHistory(eventLog).length)
      .map((w) => w.textWithCommit)
      .join("");
  }
  await copyToClipboard(words);
}

export async function copyMissedWordsList(): Promise<void> {
  const eventLog = getLastEventLog();
  if (eventLog === null) return;
  let words;
  if (Config.mode === "zen") {
    words = getInputHistory(eventLog).join("");
  } else {
    words = Object.keys(getMissedWords(eventLog)).join(" ");
  }
  await copyToClipboard(words);
}

export function copySlowWordsList(): void {
  const eventLog = getLastEventLog();
  if (eventLog === null) return;

  const burstHistory = getWordBurstHistory(eventLog);
  const validBursts = burstHistory.filter(
    (wpm) => Number.isFinite(wpm) && wpm > 0,
  );
  const avgWpm =
    validBursts.length > 0
      ? Math.round(validBursts.reduce((a, b) => a + b, 0) / validBursts.length)
      : 80;

  showSimpleModal({
    title: "Copy slow words",
    buttonText: "copy",
    buttonAlwaysEnabled: true,
    schema: z.object({
      speedThreshold: z.number().finite().positive(),
    }),
    inputs: {
      speedThreshold: {
        type: "number",
        label: "WPM threshold:",
        placeholder: "80",
        initVal: avgWpm,
      },
    },
    execFn: async ({ speedThreshold }) => {
      let typedWords: string[];
      if (Config.mode === "zen") {
        typedWords = getInputHistory(eventLog);
      } else {
        typedWords = TestWords.words
          .get()
          .slice(0, getInputHistory(eventLog).length)
          .map((w) => w.text);
      }

      const slowWords: string[] = [];
      typedWords.forEach((word, index) => {
        const speed = burstHistory[index] ?? Infinity;
        if (speed < speedThreshold) {
          slowWords.push(word);
        }
      });

      if (slowWords.length === 0) {
        return {
          status: "notice",
          message: `No words typed under ${speedThreshold} WPM`,
        };
      }

      await copyToClipboard(
        slowWords.join(" "),
        `Copied ${slowWords.length} slow word${slowWords.length > 1 ? "s" : ""} to clipboard`,
      );
      return {
        status: "success",
        showNotification: false,
      };
    },
  });
}

async function copyToClipboard(
  content: string,
  customMessage?: string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
    showNoticeNotification(customMessage ?? "Copied to clipboard", {
      durationMs: 2000,
    });
  } catch (e) {
    showErrorNotification("Could not copy to clipboard", { error: e });
  }
}
