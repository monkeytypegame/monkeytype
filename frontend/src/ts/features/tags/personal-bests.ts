import { SnapshotResult } from "../../constants/default-snapshot";
import { setTags, getTag, getActiveTags } from "./store";
import { produce } from "solid-js/store";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import { Difficulty } from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";

export function getLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
): number {
  const tag = getTag(tagId);
  if (tag === undefined) return 0;

  const personalBests = (tag.personalBests?.[mode]?.[mode2] ??
    []) as PersonalBest[];

  return (
    personalBests.find(
      (pb) =>
        (pb.punctuation ?? false) === punctuation &&
        (pb.numbers ?? false) === numbers &&
        pb.difficulty === difficulty &&
        pb.language === language &&
        (pb.lazyMode === lazyMode || (pb.lazyMode === undefined && !lazyMode)),
    )?.wpm ?? 0
  );
}

export function saveLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: Language,
  difficulty: Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number,
): void {
  if (mode === "quote") return;

  setTags(
    (tag) => tag._id === tagId,
    produce((tag) => {
      tag.personalBests ??= {
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      };

      tag.personalBests[mode] ??= {
        [mode2]: [],
      };

      tag.personalBests[mode][mode2] ??=
        [] as unknown as PersonalBests[M][Mode2<M>];

      try {
        let found = false;

        (tag.personalBests[mode][mode2] as unknown as PersonalBest[]).forEach(
          (pb) => {
            if (
              (pb.punctuation ?? false) === punctuation &&
              (pb.numbers ?? false) === numbers &&
              pb.difficulty === difficulty &&
              pb.language === language &&
              (pb.lazyMode === lazyMode ||
                (pb.lazyMode === undefined && !lazyMode))
            ) {
              found = true;
              pb.wpm = wpm;
              pb.acc = acc;
              pb.raw = raw;
              pb.timestamp = Date.now();
              pb.consistency = consistency;
              pb.lazyMode = lazyMode;
            }
          },
        );
        if (!found) {
          (tag.personalBests[mode][mode2] as unknown as PersonalBest[]).push({
            language,
            difficulty,
            lazyMode,
            punctuation,
            numbers,
            wpm,
            acc,
            raw,
            timestamp: Date.now(),
            consistency,
          });
        }
      } catch {
        tag.personalBests = {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        };
        tag.personalBests[mode][mode2] = [
          {
            language,
            difficulty,
            lazyMode,
            punctuation,
            numbers,
            wpm,
            acc,
            raw,
            timestamp: Date.now(),
            consistency,
          },
        ] as unknown as PersonalBests[M][Mode2<M>];
      }
    }),
  );
}

export function updateLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: Language,
  difficulty: Difficulty,
  lazyMode: boolean,
  results: SnapshotResult<Mode>[],
): void {
  const tag = getTag(tagId);
  if (tag === undefined) return;

  const pb = {
    wpm: 0,
    acc: 0,
    rawWpm: 0,
    consistency: 0,
  };

  results.forEach((result) => {
    if (result.tags.includes(tagId) && result.wpm > pb.wpm) {
      if (
        result.mode === mode &&
        result.mode2 === mode2 &&
        result.punctuation === punctuation &&
        result.numbers === numbers &&
        result.language === language &&
        result.difficulty === difficulty &&
        result.lazyMode === lazyMode
      ) {
        pb.wpm = result.wpm;
        pb.acc = result.acc;
        pb.rawWpm = result.rawWpm;
        pb.consistency = result.consistency;
      }
    }
  });

  saveLocalTagPB(
    tagId,
    mode,
    mode2,
    punctuation,
    numbers,
    language,
    difficulty,
    lazyMode,
    pb.wpm,
    pb.acc,
    pb.rawWpm,
    pb.consistency,
  );
}

export function getActiveTagsPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
): number {
  let tagPbWpm = 0;
  for (const tag of getActiveTags()) {
    const currTagPB = getLocalTagPB(
      tag._id,
      mode,
      mode2,
      punctuation,
      numbers,
      language,
      difficulty,
      lazyMode,
    );
    if (currTagPB > tagPbWpm) tagPbWpm = currTagPB;
  }
  return tagPbWpm;
}
