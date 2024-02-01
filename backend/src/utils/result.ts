import { ObjectId } from "mongodb";

type Result = SharedTypes.DBResult<SharedTypes.Mode>;

export function buildDbResult(
  completedEvent: SharedTypes.CompletedEvent,
  userName: string,
  isPb: boolean
): Result {
  const ce = completedEvent;
  const res: Result = {
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
    keySpacingStats: ce.keySpacingStats,
    keyDurationStats: ce.keyDurationStats,
    isPb: isPb,
    bailedOut: ce.bailedOut,
    blindMode: ce.blindMode,
    name: userName,
  };

  if (ce.bailedOut === false) delete res.bailedOut;
  if (ce.blindMode === false) delete res.blindMode;
  if (ce.lazyMode === false) delete res.lazyMode;
  if (ce.difficulty === "normal") delete res.difficulty;
  if (ce.funbox === "none") delete res.funbox;
  if (ce.language === "english") delete res.language;
  if (ce.numbers === false) delete res.numbers;
  if (ce.punctuation === false) delete res.punctuation;
  if (ce.mode !== "custom") delete res.customText;
  if (ce.mode !== "quote") delete res.quoteLength;
  if (ce.restartCount === 0) delete res.restartCount;
  if (ce.incompleteTestSeconds === 0) delete res.incompleteTestSeconds;
  if (ce.afkDuration === 0) delete res.afkDuration;
  if (ce.tags.length === 0) delete res.tags;

  if (ce.keySpacingStats === undefined) delete res.keySpacingStats;
  if (ce.keyDurationStats === undefined) delete res.keyDurationStats;

  return res;
}
