import { z } from "zod";
import { UserTag } from "@monkeytype/schemas/users";
import { createStore, produce, reconcile } from "solid-js/store";
import { SnapshotResult } from "../constants/default-snapshot";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { IdSchema } from "@monkeytype/schemas/util";
import { authEvent } from "../events/auth";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import { Difficulty } from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";

// --- Types ---

export type TagItem = UserTag & { active: boolean; display: string };

// --- localStorage ---

const activeTagsLS = new LocalStorageWithSchema({
  key: "activeTags",
  schema: z.array(IdSchema),
  fallback: [],
});

// --- Store ---

const [tags, setTags] = createStore<TagItem[]>([]);

// --- Seed ---

export function seedFromUserData(userTags: UserTag[]): void {
  const items: TagItem[] = userTags
    .map((tag) => ({
      ...tag,
      active: false,
      display: tag.name.replaceAll("_", " "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  setTags(reconcile(items, { key: "_id", merge: true }));
}

// --- Reactive accessors (for SolidJS components) ---

export { tags };

// --- Imperative accessors ---

export function getTags(): TagItem[] {
  return [...tags];
}

export function getTag(id: string): TagItem | undefined {
  return tags.find((tag) => tag._id === id);
}

export function getActiveTags(): TagItem[] {
  return tags.filter((tag) => tag.active);
}

// --- Active state management ---

export function saveActiveToLocalStorage(): void {
  activeTagsLS.set(tags.filter((t) => t.active).map((t) => t._id));
}

export function toggleTagActive(tagId: string, nosave = false): void {
  setTags(
    (tag) => tag._id === tagId,
    produce((tag) => {
      tag.active = !tag.active;
    }),
  );
  if (!nosave) saveActiveToLocalStorage();
}

export function setTagActive(
  tagId: string,
  state: boolean,
  nosave = false,
): void {
  setTags(
    (tag) => tag._id === tagId,
    produce((tag) => {
      tag.active = state;
    }),
  );
  if (!nosave) saveActiveToLocalStorage();
}

export function clearActiveTags(nosave = false): void {
  setTags(
    (tag) => tag.active,
    produce((tag) => {
      tag.active = false;
    }),
  );
  if (!nosave) saveActiveToLocalStorage();
}

function loadActiveFromLocalStorage(): void {
  const savedIds = activeTagsLS.get();
  for (const id of savedIds) {
    toggleTagActive(id, true);
  }
  saveActiveToLocalStorage();
}

// --- CRUD helpers ---

export function insertTag(tag: UserTag): void {
  setTags((prev) =>
    [
      ...prev,
      {
        ...tag,
        active: false,
        display: tag.name.replaceAll("_", " "),
      },
    ].sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function updateTag(
  tagId: string,
  updater: (old: TagItem) => void,
): void {
  setTags((tag) => tag._id === tagId, produce(updater));
}

export function deleteTag(tagId: string): void {
  setTags((prev) => prev.filter((tag) => tag._id !== tagId));
}

// --- PB logic ---

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

// --- Auth integration ---

authEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    loadActiveFromLocalStorage();
  }
});
