import _ from "lodash";
import FunboxList from "../constants/funbox-list";

interface CheckAndUpdatePbResult {
  isPb: boolean;
  personalBests: SharedTypes.PersonalBests;
  lbPersonalBests?: MonkeyTypes.LbPersonalBests;
}

type Result = Omit<SharedTypes.DBResult<SharedTypes.Mode>, "_id" | "name">;

export function canFunboxGetPb(result: Result): boolean {
  const funbox = result.funbox;
  if (!funbox || funbox === "none") return true;

  let ret = true;
  const resultFunboxes = funbox.split("#");
  for (const funbox of FunboxList) {
    if (resultFunboxes.includes(funbox.name)) {
      if (!funbox.canGetPb) {
        ret = false;
      }
    }
  }

  return ret;
}

export function checkAndUpdatePb(
  userPersonalBests: SharedTypes.PersonalBests,
  lbPersonalBests: MonkeyTypes.LbPersonalBests | undefined,
  result: Result
): CheckAndUpdatePbResult {
  const mode = result.mode;
  const mode2 = result.mode2 as SharedTypes.Mode2<"time">;

  const userPb = userPersonalBests ?? {};
  userPb[mode] ??= {};
  userPb[mode][mode2] ??= [];

  const personalBestMatch = userPb[mode][mode2].find(
    (pb: SharedTypes.PersonalBest) => matchesPersonalBest(result, pb)
  );

  let isPb = true;

  if (personalBestMatch) {
    const didUpdate = updatePersonalBest(personalBestMatch, result);
    isPb = didUpdate;
  } else {
    userPb[mode][mode2].push(buildPersonalBest(result));
  }

  if (!_.isNil(lbPersonalBests)) {
    updateLeaderboardPersonalBests(userPb, lbPersonalBests, result);
  }

  return {
    isPb,
    personalBests: userPb,
    lbPersonalBests: lbPersonalBests,
  };
}

function matchesPersonalBest(
  result: Result,
  personalBest: SharedTypes.PersonalBest
): boolean {
  if (
    result.difficulty === undefined ||
    result.language === undefined ||
    result.punctuation === undefined ||
    result.lazyMode === undefined
  ) {
    throw new Error("Missing result data (matchesPersonalBest)");
  }

  const sameLazyMode =
    result.lazyMode === personalBest.lazyMode ||
    (!result.lazyMode && !personalBest.lazyMode);
  const samePunctuation = result.punctuation === personalBest.punctuation;
  const sameDifficulty = result.difficulty === personalBest.difficulty;
  const sameLanguage = result.language === personalBest.language;

  return sameLazyMode && samePunctuation && sameDifficulty && sameLanguage;
}

function updatePersonalBest(
  personalBest: SharedTypes.PersonalBest,
  result: Result
): boolean {
  if (personalBest.wpm >= result.wpm) {
    return false;
  }

  if (
    result.difficulty === undefined ||
    result.language === undefined ||
    result.punctuation === undefined ||
    result.lazyMode === undefined ||
    result.acc === undefined ||
    result.consistency === undefined ||
    result.rawWpm === undefined ||
    result.wpm === undefined
  ) {
    throw new Error("Missing result data (updatePersonalBest)");
  }

  personalBest.difficulty = result.difficulty;
  personalBest.language = result.language;
  personalBest.punctuation = result.punctuation;
  personalBest.lazyMode = result.lazyMode;
  personalBest.acc = result.acc;
  personalBest.consistency = result.consistency;
  personalBest.raw = result.rawWpm;
  personalBest.wpm = result.wpm;
  personalBest.timestamp = Date.now();

  return true;
}

function buildPersonalBest(result: Result): SharedTypes.PersonalBest {
  if (
    result.difficulty === undefined ||
    result.language === undefined ||
    result.punctuation === undefined ||
    result.lazyMode === undefined ||
    result.acc === undefined ||
    result.consistency === undefined ||
    result.rawWpm === undefined ||
    result.wpm === undefined
  ) {
    throw new Error("Missing result data (buildPersonalBest)");
  }
  return {
    acc: result.acc,
    consistency: result.consistency,
    difficulty: result.difficulty,
    lazyMode: result.lazyMode,
    language: result.language,
    punctuation: result.punctuation,
    raw: result.rawWpm,
    wpm: result.wpm,
    timestamp: Date.now(),
  };
}

function updateLeaderboardPersonalBests(
  userPersonalBests: SharedTypes.PersonalBests,
  lbPersonalBests: MonkeyTypes.LbPersonalBests,
  result: Result
): void {
  if (!shouldUpdateLeaderboardPersonalBests(result)) {
    return;
  }

  const mode = result.mode;
  const mode2 = result.mode2 as SharedTypes.Mode2<"time">;

  lbPersonalBests[mode] = lbPersonalBests[mode] ?? {};
  const lbMode2 = lbPersonalBests[mode][mode2];
  if (!lbMode2 || Array.isArray(lbMode2)) {
    lbPersonalBests[mode][mode2] = {};
  }

  const bestForEveryLanguage = {};

  userPersonalBests[mode][mode2].forEach((pb: SharedTypes.PersonalBest) => {
    const language = pb.language;
    if (
      !bestForEveryLanguage[language] ||
      bestForEveryLanguage[language].wpm < pb.wpm
    ) {
      bestForEveryLanguage[language] = pb;
    }
  });

  _.each(
    bestForEveryLanguage,
    (pb: SharedTypes.PersonalBest, language: string) => {
      const languageDoesNotExist = !lbPersonalBests[mode][mode2][language];

      if (
        languageDoesNotExist ||
        lbPersonalBests[mode][mode2][language].wpm < pb.wpm
      ) {
        lbPersonalBests[mode][mode2][language] = pb;
      }
    }
  );
}

function shouldUpdateLeaderboardPersonalBests(result: Result): boolean {
  const isValidTimeMode =
    result.mode === "time" && (result.mode2 === "15" || result.mode2 === "60");
  return isValidTimeMode && !result.lazyMode;
}
