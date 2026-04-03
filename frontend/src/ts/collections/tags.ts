import { UserTag } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection, type WritableDeep } from "@tanstack/solid-db";
import { z } from "zod";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { showErrorNotification } from "../states/notifications";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { IdSchema } from "@monkeytype/schemas/util";
import { authEvent } from "../events/auth";
import { SnapshotResult } from "../constants/default-snapshot";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import { Difficulty } from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";

export type TagItem = UserTag & { active: boolean; display: string };

const queryKeys = {
  root: () => [...baseKey("tags", { isUserSpecific: true })],
};

function toTagItem(tag: UserTag): TagItem {
  return {
    ...tag,
    active: false,
    display: tag.name.replaceAll("_", " "),
  };
}

export const tagsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      //return empty array. We load the user with the snapshot and fill the collection from there
      return [] as TagItem[];
    },
    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const serverItems = await Promise.all(
        newItems.map(async (it) => {
          const response = await Ape.users.createTag({
            body: { tagName: it.name },
          });
          if (response.status !== 200) {
            showErrorNotification(
              `Failed to add tag: ${response.body.message}`,
            );
            throw new Error(`Failed to add tag: ${response.body.message}`);
          }
          return toTagItem(response.body.data);
        }),
      );

      tagsCollection.utils.writeBatch(() => {
        serverItems.forEach((it) => tagsCollection.utils.writeInsert(it));
      });
      return { refetch: false };
    },
    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((it) => it.key as string);

      await Promise.all(
        ids.map(async (id) => {
          const response = await Ape.users.deleteTag({
            params: { tagId: id },
          });
          if (response.status !== 200) {
            showErrorNotification(
              `Failed to delete tag: ${response.body.message}`,
            );
            throw new Error(`Failed to delete tag: ${response.body.message}`);
          }
        }),
      );

      tagsCollection.utils.writeBatch(() => {
        ids.forEach((id) => tagsCollection.utils.writeDelete(id));
      });
      return { refetch: false };
    },
  }),
);

// --- CRUD helpers ---

export function insertTag(tag: UserTag): void {
  tagsCollection.utils.writeBatch(() => {
    tagsCollection.utils.writeInsert(toTagItem(tag));
  });
}

export function updateTag(
  tagId: string,
  updater: (tag: WritableDeep<TagItem>) => void,
): void {
  tagsCollection.update(tagId, updater);
}

export function deleteTag(tagId: string): void {
  tagsCollection.utils.writeBatch(() => {
    tagsCollection.utils.writeDelete(tagId);
  });
}

export function getTags(): TagItem[] {
  return tagsCollection.map((tag) => tag);
}

export function getTag(id: string): TagItem | undefined {
  return tagsCollection.get(id);
}

export function getActiveTags(): TagItem[] {
  return tagsCollection.map((tag) => tag).filter((tag) => tag.active);
}

export function seedFromUserData(userTags: UserTag[]): void {
  const items = userTags
    .map(toTagItem)
    .sort((a, b) => a.name.localeCompare(b.name));

  tagsCollection.utils.writeBatch(() => {
    items.forEach((it) => tagsCollection.utils.writeInsert(it));
  });
}

// --- Active state ---

const activeTagsLS = new LocalStorageWithSchema({
  key: "activeTags",
  schema: z.array(IdSchema),
  fallback: [],
});

export function saveActiveToLocalStorage(): void {
  const activeIds: string[] = [];
  tagsCollection.forEach((t) => {
    if (t.active) activeIds.push(t._id);
  });
  activeTagsLS.set(activeIds);
}

export function toggleTagActive(tagId: string, nosave = false): void {
  tagsCollection.update(tagId, (tag) => {
    tag.active = !tag.active;
  });
  if (!nosave) saveActiveToLocalStorage();
}

export function setTagActive(
  tagId: string,
  state: boolean,
  nosave = false,
): void {
  tagsCollection.update(tagId, (tag) => {
    tag.active = state;
  });
  if (!nosave) saveActiveToLocalStorage();
}

export function clearActiveTags(nosave = false): void {
  tagsCollection.forEach((tag) => {
    if (tag.active) {
      tagsCollection.update(tag._id, (t) => {
        t.active = false;
      });
    }
  });
  if (!nosave) saveActiveToLocalStorage();
}

function loadActiveFromLocalStorage(): void {
  const savedIds = activeTagsLS.get();
  for (const id of savedIds) {
    toggleTagActive(id, true);
  }
  saveActiveToLocalStorage();
}

authEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    loadActiveFromLocalStorage();
  }
});

// --- Personal bests ---

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

  tagsCollection.update(tagId, (tag) => {
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
  });
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
