import { CompletedEvent, Result } from "@monkeytype/contracts/schemas/results";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import { ObjectId } from "mongodb";
import { WithObjectId } from "./misc";

export type DBResult = WithObjectId<Result<Mode>> & {
  //legacy values
  correctChars?: number;
  incorrectChars?: number;
};

export function buildDbResult(
  completedEvent: CompletedEvent,
  userName: string,
  isPb: boolean
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
  if (ce.funbox === "none") delete res.funbox;
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
    result.charStats = [result.correctChars, result.incorrectChars, 0, 0];
    delete result.correctChars;
    delete result.incorrectChars;
  }
  return result;
}
