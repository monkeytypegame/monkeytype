import * as Numbers from "@monkeytype/util/numbers";
import { CompletedEventCustomText } from "@monkeytype/schemas/results";
import { Config } from "../../config/store";
import { getActiveTags } from "../../queries/tags";
import { getUserData } from "../../queries/user";
import {
  type CompletedResult,
  getCurrentQuote,
  getIncompleteSeconds,
  getIncompleteTests,
  getRestartCount,
  isRepeated,
} from "../../states/test";
import * as Misc from "../../utils/misc";
import { calculateWpm } from "../../utils/numbers";
import * as Strings from "../../utils/strings";
import {
  getAccuracy,
  getAfkDuration,
  getBurstHistory,
  getChars,
  getDateBasedTestDurationMs,
  getErrorCountHistory,
  getKeypressDurations,
  getKeypressesPerSecond,
  getKeypressOverlap,
  getKeypressSpacing,
  getLastKeypressToEndMs,
  getStartToFirstKeypressMs,
  getTestDurationMs,
  getWpmHistory,
} from "./events/stats";
import { EventLog } from "./events/types";
import { getTestEnd, type TestEnd } from "./state";
import { getTestSettings } from "./test-settings";

/**
 * The first check a finished test failed, else "ok". Only "ok" is saved.
 * failed: a fail check ended the test (min speed, stop on error…), not
 * invalid. The rest make the result invalid.
 */
export type ResultDataCheck =
  | "ok"
  | "inconsistentDuration"
  | "failed"
  | "tooShort"
  | "afk"
  | "repeated"
  | "wpm"
  | "raw"
  | "accuracy";

/** A finished test's result: the engine builds it after finish(). */
export type ResultData = {
  /** the result object, before the server adds hash and uid */
  completedEvent: CompletedResult;
  /** a field is undefined or NaN: never saved */
  malformed: boolean;
  check: ResultDataCheck;
  /** no keypresses in the last 5 seconds (never for a bail out) */
  afkDetected: boolean;
  end: TestEnd;
  /** the finished test's frozen log: the result's input */
  eventLog: EventLog;
};

/**
 * Builds the finished test's result from its frozen log. Reads the test
 * settings, and the active tags as they are now (tags are live).
 */
export function buildResultData(eventLog: EventLog, end: TestEnd): ResultData {
  const completedEvent = buildCompletedEvent(eventLog);
  const bailedOut = end.type === "bailedOut";
  const afkDetected =
    !bailedOut &&
    getKeypressesPerSecond(eventLog)
      .slice(-5)
      .every((kps) => kps === 0);
  return {
    completedEvent,
    malformed: countUndefined(completedEvent) > 0,
    check: checkResult(completedEvent, eventLog, end, afkDetected),
    afkDetected,
    end,
    eventLog,
  };
}

function countUndefined(input: unknown): number {
  if (typeof input === "number") {
    return isNaN(input) ? 1 : 0;
  } else if (typeof input === "undefined") {
    return 1;
  } else if (typeof input === "object" && input !== null) {
    return Object.values(input).reduce(
      (a, b) => (a + countUndefined(b)) as number,
      0,
    ) as number;
  } else {
    return 0;
  }
}

function checkResult(
  ce: CompletedResult,
  eventLog: EventLog,
  end: TestEnd,
  afkDetected: boolean,
): ResultDataCheck {
  const settings = getTestSettings();
  const bailedOut = end.type === "bailedOut";
  const mode2Number = parseInt(ce.mode2);
  const dateDur = getDateBasedTestDurationMs(eventLog) / 1000;
  if (
    settings.mode === "time" &&
    !bailedOut &&
    (ce.testDuration < dateDur - 0.1 || ce.testDuration > dateDur + 0.1) &&
    ce.testDuration <= 120
  ) {
    console.error("Test duration inconsistent", ce.testDuration, dateDur);
    return "inconsistentDuration";
  }
  if (end.type === "failed") return "failed";
  if (
    ce.testDuration < 1 ||
    (settings.mode === "time" && mode2Number < 15 && mode2Number > 0) ||
    (settings.mode === "time" && mode2Number === 0 && ce.testDuration < 15) ||
    (settings.mode === "words" && mode2Number < 10 && mode2Number > 0) ||
    (settings.mode === "words" && mode2Number === 0 && ce.testDuration < 15) ||
    (settings.mode === "custom" &&
      (settings.customText.limit.mode === "word" ||
        settings.customText.limit.mode === "section") &&
      settings.customText.limit.value < 10) ||
    (settings.mode === "custom" &&
      settings.customText.limit.mode === "time" &&
      settings.customText.limit.value < 15) ||
    (settings.mode === "zen" && ce.testDuration < 15)
  ) {
    return "tooShort";
  }
  if (afkDetected) return "afk";
  if (isRepeated()) return "repeated";
  if (
    ce.wpm < 0 ||
    (ce.wpm > 350 && ce.mode !== "words" && ce.mode2 !== "10") ||
    (ce.wpm > 420 && ce.mode === "words" && ce.mode2 === "10")
  ) {
    return "wpm";
  }
  if (
    ce.rawWpm < 0 ||
    (ce.rawWpm > 350 && ce.mode !== "words" && ce.mode2 !== "10") ||
    (ce.rawWpm > 420 && ce.mode === "words" && ce.mode2 === "10")
  ) {
    return "raw";
  }
  const lbOptOut = getUserData()?.lbOptOut === true;
  if (
    (!lbOptOut && (ce.acc < 75 || ce.acc > 100)) ||
    (lbOptOut && (ce.acc < 50 || ce.acc > 100))
  ) {
    return "accuracy";
  }
  return "ok";
}

function buildCompletedEvent(eventLog: EventLog): CompletedResult {
  const chars = getChars(eventLog);

  //tags
  const activeTagsIds: string[] = getActiveTags().map((tag) => tag._id);

  let language = getTestSettings().language;
  if (getTestSettings().mode === "quote") {
    language = Strings.removeLanguageSize(getTestSettings().language);
  }

  let customText: CompletedEventCustomText | undefined = undefined;
  if (getTestSettings().mode === "custom") {
    const temp = getTestSettings().customText;
    customText = {
      textLen: temp.text.length,
      mode: temp.mode,
      pipeDelimiter: temp.pipeDelimiter,
      limit: { ...temp.limit },
    };
  }

  let duration = getTestDurationMs(eventLog) / 1000;

  const rawPerSecond = getBurstHistory(eventLog);
  const afkDuration = getAfkDuration(eventLog);
  const stddev = Numbers.stdDev(rawPerSecond);
  const avg = Numbers.mean(rawPerSecond);
  let consistency = Numbers.roundTo2(Numbers.kogasa(stddev / avg));
  if (!consistency || isNaN(consistency)) {
    consistency = 0;
  }

  const keypressSpacing = getKeypressSpacing(eventLog);

  let keyConsistencyArray = [...keypressSpacing];
  if (keypressSpacing.length > 0) {
    keyConsistencyArray = keyConsistencyArray.slice(
      0,
      keyConsistencyArray.length - 1,
    );
  }
  const keyStddev = Numbers.stdDev(keyConsistencyArray);
  const keyAvg = Numbers.mean(keyConsistencyArray);
  let keyConsistency = Numbers.roundTo2(Numbers.kogasa(keyStddev / keyAvg));
  if (!keyConsistency || isNaN(keyConsistency)) {
    keyConsistency = 0;
  }

  const wpmHistory = getWpmHistory(eventLog);
  const wpmCons = Numbers.roundTo2(
    Numbers.kogasa(Numbers.stdDev(wpmHistory) / Numbers.mean(wpmHistory)),
  );
  const wpmConsistency = isNaN(wpmCons) ? 0 : wpmCons;

  const chartData = {
    wpm: wpmHistory,
    burst: rawPerSecond,
    err: getErrorCountHistory(eventLog),
  };

  const currentQuote = getCurrentQuote();
  const completedEvent: CompletedResult = {
    wpm: Numbers.roundTo2(calculateWpm(chars.correctWord, duration)),
    rawWpm: Numbers.roundTo2(
      calculateWpm(chars.allCorrect + chars.incorrect + chars.extra, duration),
    ),
    charStats: [chars.correctWord, chars.incorrect, chars.extra, chars.missed],
    charTotal: chars.allCorrect + chars.incorrect + chars.extra,
    acc: Numbers.roundTo2(getAccuracy(eventLog).percentage ?? 0),
    language: language,
    testDuration: duration,
    lastKeyToEnd: getLastKeypressToEndMs(eventLog),
    startToFirstKey: getStartToFirstKeypressMs(eventLog),
    afkDuration: afkDuration,
    quoteLength: currentQuote?.group ?? -1,
    customText: customText,
    tags: activeTagsIds,
    punctuation: getTestSettings().punctuation,
    numbers: getTestSettings().numbers,
    lazyMode: getTestSettings().lazyMode,
    timestamp: Date.now(),
    mode: getTestSettings().mode,
    mode2: Misc.getMode2(getTestSettings(), currentQuote),
    bailedOut: getTestEnd()?.type === "bailedOut",
    funbox: [...getTestSettings().funbox],
    difficulty: getTestSettings().difficulty,
    blindMode: Config.blindMode,
    stopOnLetter: getTestSettings().stopOnError === "letter",
    restartCount: getRestartCount(),
    incompleteTests: getIncompleteTests(),
    incompleteTestSeconds:
      getIncompleteSeconds() < 0 ? 0 : Numbers.roundTo2(getIncompleteSeconds()),

    consistency: consistency,
    wpmConsistency: wpmConsistency,
    keyConsistency: keyConsistency,
    chartData: chartData,

    keySpacing: keypressSpacing,
    keyDuration: getKeypressDurations(eventLog),
    keyOverlap: getKeypressOverlap(eventLog),
  };

  if (completedEvent.mode !== "custom") delete completedEvent.customText;
  if (completedEvent.mode !== "quote") delete completedEvent.quoteLength;

  return completedEvent;
}
