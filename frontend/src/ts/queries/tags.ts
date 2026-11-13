import { Difficulty } from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import { UserTag } from "@monkeytype/schemas/users";
import { IdSchema } from "@monkeytype/schemas/util";
import { Result } from "@monkeytype/util/trycatch";
import { createMemo, createRoot } from "solid-js";
import { z } from "zod";

import Ape from "../ape";
import { fetchUserFromApi } from "../ape/user";
import type { NormalizedLocalResult } from "../collections/results";
import { tempId } from "../collections/utils/misc";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { updateTagsInFilterStorage } from "../states/result-filters";
import {
  replaceSpacesWithUnderscores,
  replaceUnderscoresWithSpaces,
} from "../utils/strings";
import { DeepReadonly } from "../utils/types";
import { UserDataLoadError } from "../utils/user-data-load-error";
import {
  type ApiResponse,
  type MutationOptions,
  type OptimisticMutation,
  optimisticMutation,
  runMutation,
} from "./utils/optimistic-mutation";
import { createSessionQuery } from "./utils/session-query";

/**
 * The signed-in user's tags: a list session query beside the user, so tag
 * edits don't replace the user. It reads the user endpoint through
 * `fetchUserFromApi`, which the user query shares (one request). Which tags are
 * active is local: a signal backed by localStorage. Getters return only what's
 * loaded, never fetch; reactive inside components and effects, a plain read
 * elsewhere.
 */
export type Tag = DeepReadonly<UserTag>;

const tagsQuery = createSessionQuery<UserTag[]>({
  name: "tags",
  fetch: fetchTags,
  id: (tag) => tag._id,
});

const emptyPbs = (): PersonalBests => ({
  time: {},
  words: {},
  quote: {},
  zen: {},
  custom: {},
});

const [activeIds, setActiveIds] = createRoot(() =>
  useLocalStorage({
    key: "activeTags",
    schema: z.array(IdSchema),
    fallback: [],
    syncAcrossTabs: false,
  }),
);

const tags = createRoot(() =>
  createMemo(() =>
    [...(tagsQuery.get() ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
  ),
);

const activeTags = createRoot(() =>
  createMemo(() => {
    const active = new Set(activeIds());
    return tags().filter((tag) => active.has(tag._id));
  }),
);

// --- Loading ---

/** Picks the tags from the user endpoint, names with spaces. */
async function fetchTags(): Promise<UserTag[]> {
  const userData = await fetchUserFromApi();
  if (userData === undefined) {
    throw new UserDataLoadError("Tags didn't load: not signed in", 401);
  }

  const tags = (userData.tags ?? []).map((tag) => ({
    ...tag,
    name: replaceUnderscoresWithSpaces(tag.name),
  }));
  updateTagsInFilterStorage(tags.map((tag) => tag._id));
  return tags;
}

/** Downloads the tags (the auth flow, beside `loadUserData`); throws on failure. */
export async function loadTags(): Promise<void> {
  await tagsQuery.download();
}

// --- Reads ---

/** The user's tags, sorted by name; empty without a user. */
export function getTags(): readonly Tag[] {
  return tags();
}

/** Whether the user download filled the tags (false while signed out). */
export function areTagsLoaded(): boolean {
  return tagsQuery.get() !== undefined;
}

export function getTag(id: string): Tag | undefined {
  return tags().find((tag) => tag._id === id);
}

/** The active tags (of the user's tags), sorted by name. */
export function getActiveTags(): readonly Tag[] {
  return activeTags();
}

export function isTagActive(id: string): boolean {
  return activeIds().includes(id);
}

// --- Active state: local only ---

export function toggleTagActive(id: string): void {
  setActiveIds((ids) =>
    ids.includes(id) ? ids.filter((it) => it !== id) : [...ids, id],
  );
}

/** Makes exactly these tags active. */
export function setActiveTags(ids: readonly string[]): void {
  setActiveIds([...new Set(ids)]);
}

// --- Optimistic actions: rolled back by tag id if the request fails ---

/** An optimistic mutation on the tags, rolled back by tag id. */
function tagsMutation<V, R extends ApiResponse>(
  options: MutationOptions<UserTag[], V, R>,
): OptimisticMutation<UserTag[], V> {
  return optimisticMutation({ ...options, query: tagsQuery });
}

function syncFilterStorage(): void {
  updateTagsInFilterStorage(getTags().map((tag) => tag._id));
}

type Insert = { tempId: string; name: string; tag?: UserTag };

const insertTagMutation = tagsMutation({
  name: "insertTag",
  // idempotent: the server's tag replaces the temporary one
  recipe: (list, { tempId, name, tag }: Insert) => {
    const temp = list.findIndex((it) => it._id === tempId);
    if (temp !== -1) list.splice(temp, 1);
    const item = tag ?? { _id: tempId, name, personalBests: emptyPbs() };
    if (!list.some((it) => it._id === item._id)) list.push(item);
  },
  request: async (vars) =>
    Ape.users.createTag({
      body: { tagName: replaceSpacesWithUnderscores(vars.name) },
    }),
  fromResponse: (vars, { body: { data: tag } }) => ({
    ...vars,
    tag: { ...tag, name: replaceUnderscoresWithSpaces(tag.name) },
  }),
});

export async function insertTag(name: string): Promise<Result<void>> {
  const result = await runMutation(insertTagMutation, {
    tempId: tempId(),
    name: replaceUnderscoresWithSpaces(name),
  });
  if (result.error === null) syncFilterStorage();
  return result;
}

type Rename = { tagId: string; name: string };

const updateTagNameMutation = tagsMutation({
  name: "updateTagName",
  recipe: (list, { tagId, name }: Rename) => {
    const tag = list.find((it) => it._id === tagId);
    if (tag !== undefined) tag.name = name;
  },
  request: async (rename) =>
    Ape.users.editTag({
      body: {
        tagId: rename.tagId,
        newName: replaceSpacesWithUnderscores(rename.name),
      },
    }),
});

export async function updateTagName(
  tagId: string,
  name: string,
): Promise<Result<void>> {
  return runMutation(updateTagNameMutation, {
    tagId,
    name: replaceUnderscoresWithSpaces(name),
  });
}

const clearTagPBsMutation = tagsMutation({
  name: "clearTagPBs",
  recipe: (list, tagId: string) => {
    const tag = list.find((it) => it._id === tagId);
    if (tag !== undefined) tag.personalBests = emptyPbs();
  },
  request: async (tagId) =>
    Ape.users.deleteTagPersonalBest({ params: { tagId } }),
});

export async function clearTagPBs(tagId: string): Promise<Result<void>> {
  return runMutation(clearTagPBsMutation, tagId);
}

const deleteTagMutation = tagsMutation({
  name: "deleteTag",
  recipe: (list, tagId: string) => {
    const index = list.findIndex((it) => it._id === tagId);
    if (index !== -1) list.splice(index, 1);
  },
  request: async (tagId) => Ape.users.deleteTag({ params: { tagId } }),
});

export async function deleteTag(tagId: string): Promise<Result<void>> {
  const result = await runMutation(deleteTagMutation, tagId);
  if (result.error === null) {
    setActiveIds((ids) => ids.filter((id) => id !== tagId));
    syncFilterStorage();
  }
  return result;
}

// --- Personal bests: local only, the result saving updates the server ---

function matchesPb(
  pb: DeepReadonly<PersonalBest>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
): boolean {
  return (
    (pb.punctuation ?? false) === punctuation &&
    (pb.numbers ?? false) === numbers &&
    pb.difficulty === difficulty &&
    pb.language === language &&
    (pb.lazyMode === lazyMode || (pb.lazyMode === undefined && !lazyMode))
  );
}

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

  const byMode2 = tag.personalBests?.[mode] as
    | Readonly<Record<string, readonly DeepReadonly<PersonalBest>[]>>
    | undefined;

  return (
    byMode2?.[mode2]?.find((pb) =>
      matchesPb(pb, punctuation, numbers, language, difficulty, lazyMode),
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

  tagsQuery.update((list) => {
    const tag = list.find((it) => it._id === tagId);
    if (tag === undefined) return;

    const pb = {
      wpm,
      acc,
      raw,
      timestamp: Date.now(),
      consistency,
      lazyMode,
    };

    tag.personalBests ??= emptyPbs();
    const byMode2 = (tag.personalBests[mode] ??= {}) as Record<
      string,
      PersonalBest[]
    >;
    const pbs = (byMode2[mode2] ??= []);
    const existing = pbs.find((it) =>
      matchesPb(it, punctuation, numbers, language, difficulty, lazyMode),
    );
    if (existing !== undefined) {
      Object.assign(existing, pb);
    } else {
      pbs.push({ ...pb, language, difficulty, punctuation, numbers });
    }
  });
}

export function reconcileLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: Language,
  difficulty: Difficulty,
  lazyMode: boolean,
  results: NormalizedLocalResult<Mode>[],
): void {
  if (getTag(tagId) === undefined) return;

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
