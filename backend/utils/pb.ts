import _ from "lodash";

interface CheckAndUpdatePbResult {
  isPb: boolean;
  personalBests: MonkeyTypes.PersonalBests;
  lbPersonalBests?: MonkeyTypes.LbPersonalBests;
}

type Result = MonkeyTypes.Result<MonkeyTypes.Mode>;

export function checkAndUpdatePb(
  userPersonalBests: MonkeyTypes.PersonalBests,
  lbPersonalBests: MonkeyTypes.LbPersonalBests | undefined,
  result: Result
): CheckAndUpdatePbResult {
  const mode = result.mode;
  const mode2 = result.mode2 as 15 | 60;

  const userPb = userPersonalBests ?? {};
  userPb[mode] = userPb[mode] ?? {};
  userPb[mode][mode2] = userPb[mode][mode2] ?? [];

  const personalBestMatch: MonkeyTypes.PersonalBest = userPb[mode][mode2].find(
    (pb: MonkeyTypes.PersonalBest) => {
      return matchesPersonalBest(result, pb);
    }
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
  personalBest: MonkeyTypes.PersonalBest
): boolean {
  const sameLazyMode =
    result.lazyMode === personalBest.lazyMode ||
    (!result.lazyMode && !personalBest.lazyMode);
  const samePunctuation = result.punctuation === personalBest.punctuation;
  const sameDifficulty = result.difficulty === personalBest.difficulty;
  const sameLanguage = result.language === personalBest.language;

  return sameLazyMode && samePunctuation && sameDifficulty && sameLanguage;
}

function updatePersonalBest(
  personalBest: MonkeyTypes.PersonalBest,
  result: Result
): boolean {
  if (personalBest.wpm > result.wpm) {
    return false;
  }

  personalBest.acc = result.acc;
  personalBest.consistency = result.consistency;
  personalBest.difficulty = result.difficulty;
  personalBest.language = result.language;
  personalBest.punctuation = result.punctuation ?? false;
  personalBest.lazyMode = result.lazyMode ?? false;
  personalBest.raw = result.rawWpm;
  personalBest.wpm = result.wpm;
  personalBest.timestamp = Date.now();

  return true;
}

function buildPersonalBest(result: Result): MonkeyTypes.PersonalBest {
  return {
    acc: result.acc,
    consistency: result.consistency,
    difficulty: result.difficulty,
    lazyMode: result.lazyMode ?? false,
    language: result.language,
    punctuation: result.punctuation ?? false,
    raw: result.rawWpm,
    wpm: result.wpm,
    timestamp: Date.now(),
  };
}

function updateLeaderboardPersonalBests(
  userPersonalBests: MonkeyTypes.PersonalBests,
  lbPersonalBests: MonkeyTypes.LbPersonalBests,
  result: Result
): void {
  if (!shouldUpdateLeaderboardPersonalBests(result)) {
    return;
  }

  const mode = result.mode;
  const mode2 = result.mode2 as MonkeyTypes.Mode2<"time">;

  lbPersonalBests[mode] = lbPersonalBests[mode] ?? {};
  const lbMode2 = lbPersonalBests[mode][mode2];
  if (!lbMode2 || Array.isArray(lbMode2)) {
    lbPersonalBests[mode][mode2] = {};
  }

  const bestForEveryLanguage = {};

  userPersonalBests[mode][mode2].forEach((pb: MonkeyTypes.PersonalBest) => {
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
    (pb: MonkeyTypes.PersonalBest, language: string) => {
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
