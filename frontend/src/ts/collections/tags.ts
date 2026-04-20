import { UserTag } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import { z } from "zod";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { IdSchema } from "@monkeytype/schemas/util";
import { SnapshotResult } from "../constants/default-snapshot";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import { Difficulty } from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";

export type TagItem = UserTag & { active: boolean };

const queryKeys = {
  root: () => [...baseKey("tags", { isUserSpecific: true })],
};

const tagsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    startSync: true,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      return [] as TagItem[];
    },
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useTagsLiveQuery() {
  return useLiveQuery((q) => {
    return q
      .from({ tag: tagsCollection })
      .orderBy(({ tag }) => tag.name, "asc");
  });
}

type ActionType = {
  insertTag: {
    name: string;
  };
  updateTagName: {
    tagId: string;
    newName: string;
  };
  clearTagPBs: {
    tagId: string;
  };
  deleteTag: {
    tagId: string;
  };
};

const actions = {
  insertTag: createOptimisticAction<ActionType["insertTag"]>({
    onMutate: ({ name }) => {
      tagsCollection.insert({
        _id: "temp-" + Date.now(),
        name,
        personalBests: { time: {}, words: {}, quote: {}, zen: {}, custom: {} },
        active: false,
      });
    },
    mutationFn: async ({ name }) => {
      const response = await Ape.users.createTag({
        body: { tagName: name.replace(/ /g, "_") },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to add tag: ${response.body.message}`);
      }
      const newTag = {
        ...response.body.data,
        name: response.body.data.name.replace(/_/g, " "),
        active: false,
      };

      tagsCollection.utils.writeInsert(newTag);
    },
  }),
  updateTagName: createOptimisticAction<ActionType["updateTagName"]>({
    onMutate: ({ tagId, newName }) => {
      tagsCollection.update(tagId, (tag) => {
        tag.name = newName;
      });
    },
    mutationFn: async ({ tagId, newName }) => {
      const response = await Ape.users.editTag({
        body: { tagId, newName: newName.replace(/ /g, "_") },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to update tag: ${response.body.message}`);
      }

      tagsCollection.utils.writeUpdate({
        _id: tagId,
        name: newName,
      });
    },
  }),
  clearTagPBs: createOptimisticAction<ActionType["clearTagPBs"]>({
    onMutate: ({ tagId }) => {
      tagsCollection.update(tagId, (tag) => {
        tag.personalBests = {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        };
      });
    },
    mutationFn: async ({ tagId }) => {
      const response = await Ape.users.deleteTagPersonalBest({
        params: { tagId },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to clear tag PBs: ${response.body.message}`);
      }

      tagsCollection.utils.writeUpdate({
        _id: tagId,
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
      });
    },
  }),
  deleteTag: createOptimisticAction<ActionType["deleteTag"]>({
    onMutate: ({ tagId }) => {
      tagsCollection.delete(tagId);
    },
    mutationFn: async ({ tagId }) => {
      const response = await Ape.users.deleteTag({
        params: { tagId },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to delete tag: ${response.body.message}`);
      }
      tagsCollection.utils.writeDelete(tagId);
    },
  }),
};

// --- Public API ---

export async function insertTag(
  params: ActionType["insertTag"],
): Promise<void> {
  const transaction = actions.insertTag(params);
  await transaction.isPersisted.promise;
}

export async function updateTagName(
  params: ActionType["updateTagName"],
): Promise<void> {
  const transaction = actions.updateTagName(params);
  await transaction.isPersisted.promise;
}

export async function clearTagPBs(
  params: ActionType["clearTagPBs"],
): Promise<void> {
  const transaction = actions.clearTagPBs(params);
  await transaction.isPersisted.promise;
}

export async function deleteTag(
  params: ActionType["deleteTag"],
): Promise<void> {
  const transaction = actions.deleteTag(params);
  await transaction.isPersisted.promise;
}

function getTags(): TagItem[] {
  return [...tagsCollection.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function getTag(id: string): TagItem | undefined {
  return tagsCollection.get(id);
}

function getActiveTags(): TagItem[] {
  return getTags().filter((tag) => tag.active);
}

export function fillTagsCollection(userTags: UserTag[]): void {
  const activeIds = activeTagsLS.get();

  const tagItems = userTags.map((tag) => ({
    ...tag,
    name: tag.name.replace(/_/g, " "),
    active: activeIds.includes(tag._id),
  }));

  tagsCollection.utils.writeBatch(() => {
    tagsCollection.forEach((tag) => {
      tagsCollection.utils.writeDelete(tag._id);
    });
    tagItems.forEach((item) => {
      tagsCollection.utils.writeInsert(item);
    });
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
  const tag = tagsCollection.get(tagId);
  if (tag === undefined) return;
  tagsCollection.utils.writeUpdate({ ...tag, active: !tag.active });
  if (!nosave) saveActiveToLocalStorage();
}

export function setTagActive(
  tagId: string,
  state: boolean,
  nosave = false,
): void {
  const tag = tagsCollection.get(tagId);
  if (tag === undefined) return;
  tagsCollection.utils.writeUpdate({ ...tag, active: state });
  if (!nosave) saveActiveToLocalStorage();
}

export function clearActiveTags(nosave = false): void {
  tagsCollection.utils.writeBatch(() => {
    tagsCollection.forEach((tag) => {
      if (tag.active) {
        tagsCollection.utils.writeUpdate({ ...tag, active: false });
      }
    });
  });
  if (!nosave) saveActiveToLocalStorage();
}

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

  const collectionTag = tagsCollection.get(tagId);
  if (collectionTag === undefined) return;
  const tag = structuredClone(collectionTag);

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
          (pb.lazyMode === lazyMode || (pb.lazyMode === undefined && !lazyMode))
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

  // using utils.writeUpdate instead of collection.update because we dont need to send this to the API
  // the result saving already updates the tag pb in the db
  tagsCollection.utils.writeUpdate(tag);
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

/**
 * Used for non reactive access. Do not use in Solid components.
 */
export const __nonReactive = {
  getTags,
  getTag,
  getActiveTags,
};
