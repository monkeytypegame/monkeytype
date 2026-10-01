import {
  ChartData,
  CompletedEvent,
  OldChartData,
  Result,
} from "@monkeytype/schemas/results";
import { Mode } from "@monkeytype/schemas/shared";
import { ObjectId } from "mongodb";
import { WithObjectId } from "./misc";
import { FunboxName } from "@monkeytype/schemas/configs";

export type DBResult = WithObjectId<Result<Mode>> & {
  //legacy values
  correctChars?: number;
  incorrectChars?: number;
  chartData: ChartData | OldChartData | "toolong";
};

export function buildDbResult(
  completedEvent: CompletedEvent,
  userName: string,
  isPb: boolean,
): DBResult {
  const ce = completedEvent;
  const res: DBResult = {
    _id: new ObjectId(),
    uid: ce.uid,
    wpm: ce.wpm,
    rawWpm: ce.rawWpm,
    charStats: ce.charStats,
    acc: ce.acc,
    mode: ce.mode,
    mode2: ce.mode2,
    quoteLength: ce.quoteLength,
    timestamp: ce.timestamp,
    restartCount: ce.restartCount,
    incompleteTestSeconds: ce.incompleteTestSeconds,
    testDuration: ce.testDuration,
    afkDuration: ce.afkDuration,
    tags: ce.tags,
    consistency: ce.consistency,
    keyConsistency: ce.keyConsistency,
    chartData: ce.chartData,
    language: ce.language,
    lazyMode: ce.lazyMode,
    difficulty: ce.difficulty,
    funbox: ce.funbox,
    numbers: ce.numbers,
    punctuation: ce.punctuation,
    isPb: isPb,
    bailedOut: ce.bailedOut,
    blindMode: ce.blindMode,
    name: userName,
  };

  //compress object by omitting default values. Frontend will add them back after reading
  //reduces object size on the database and on the rest api
  if (!ce.bailedOut) delete res.bailedOut;
  if (!ce.blindMode) delete res.blindMode;
  if (!ce.lazyMode) delete res.lazyMode;
  if (ce.difficulty === "normal") delete res.difficulty;
  if (ce.funbox.length === 0) delete res.funbox;
  if (ce.language === "english") delete res.language;
  if (!ce.numbers) delete res.numbers;
  if (!ce.punctuation) delete res.punctuation;
  if (ce.mode !== "quote") delete res.quoteLength;
  if (ce.restartCount === 0) delete res.restartCount;
  if (ce.incompleteTestSeconds === 0) delete res.incompleteTestSeconds;
  if (ce.afkDuration === 0) delete res.afkDuration;
  if (ce.tags.length === 0) delete res.tags;
  if (res.isPb === false) delete res.isPb;

  return res;
}

/**
 * Convert legacy values
 * @param result
 * @returns
 */
export function replaceLegacyValues(result: DBResult): DBResult {
  //convert legacy values
  if (
    result.correctChars !== undefined &&
    result.incorrectChars !== undefined
  ) {
    //super edge case but just in case
    if (result.charStats !== undefined) {
      result.charStats = [
        result.charStats[0],
        result.charStats[1],
        result.charStats[2],
        result.charStats[3],
      ];
      delete result.correctChars;
      delete result.incorrectChars;
    } else {
      result.charStats = [result.correctChars, result.incorrectChars, 0, 0];
      delete result.correctChars;
      delete result.incorrectChars;
    }
  }

  if (typeof result.funbox === "string") {
    if (result.funbox === "none") {
      result.funbox = [];
    } else {
      result.funbox = (result.funbox as string).split("#") as FunboxName[];
    }
  }

  if (
    result.chartData !== undefined &&
    result.chartData !== "toolong" &&
    "raw" in result.chartData
  ) {
    const temp = result.chartData;
    result.chartData = {
      wpm: temp.wpm,
      burst: temp.raw,
      err: temp.err,
    };
  }

  if (typeof result.mode2 === "number") {
    result.mode2 = (result.mode2 as number).toString();
  }

  //legacy value for english_1k
  if ((result.language as string) === "english_expanded") {
    result.language = "english_1k";
  }

  return result;
}
