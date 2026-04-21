import { ResultMinified } from "@monkeytype/schemas/results";
import { Difficulty, Mode, Mode2 } from "@monkeytype/schemas/shared";
import { ResultFilters } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  avg,
  count,
  createCollection,
  createLiveQueryCollection,
  createOptimisticAction,
  eq,
  gte,
  inArray,
  length,
  max,
  not,
  or,
  Query,
  sum,
  useLiveQuery,
} from "@tanstack/solid-db";
import { queryOptions } from "@tanstack/solid-query";
import { Accessor } from "solid-js";
import Ape from "../ape";
import { SnapshotResult } from "../constants/default-snapshot";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { __nonReactive as tagsNonReactive, updateLocalTagPB } from "./tags";
import { ExactlyOneTrue } from "../utils/types";
import { isAuthenticated } from "../states/core";
import { createEffectOn } from "../hooks/effects";

export type ResultsQueryState = {
  difficulty: SnapshotResult<Mode>["difficulty"][];
  pb: SnapshotResult<Mode>["isPb"][];
  mode: SnapshotResult<Mode>["mode"][];
  words: ("10" | "25" | "50" | "100" | "custom")[];
  time: ("15" | "30" | "60" | "120" | "custom")[];
  punctuation: SnapshotResult<Mode>["punctuation"][];
  numbers: SnapshotResult<Mode>["numbers"][];
  timestamp: SnapshotResult<Mode>["timestamp"];
  quoteLength: SnapshotResult<Mode>["quoteLength"][];
  tags: SnapshotResult<Mode>["tags"];
  funbox: SnapshotResult<Mode>["funbox"];
  language: SnapshotResult<Mode>["language"][];
};

const queryKeys = {
  root: () => [...baseKey("results", { isUserSpecific: true })],
  fullResult: (_id: string) => [...queryKeys.root(), _id],
};

export type ResultStats = {
  words: number;
  restarted: number;
  completed: number;
  maxWpm: number;
  avgWpm: number;
  maxRaw: number;
  avgRaw: number;
  maxAcc: number;
  avgAcc: number;
  maxConsistency: number;
  avgConsistency: number;
  timeTyping: number;
  dayTimestamp?: number;
};

/**
 * get aggregated statistics for the current result selection
 * @param queryState
 * @param options
 * @returns
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
export function useResultStatsLiveQuery(
  queryState: Accessor<ResultsQueryState | undefined>,
  options?: { lastTen?: true } | { groupByDay?: true },
) {
  return useLiveQuery((q) => {
    const state = queryState();
    if (state === undefined) return undefined;

    const isLastTen =
      options !== undefined && "lastTen" in options && options.lastTen;
    const isGroupByDay =
      options !== undefined && "groupByDay" in options && options.groupByDay;

    let query = isLastTen
      ? //for lastTen we need a sub-query to apply the sort+limit first and then run the aggregations
        q.from({
          r: q
            .from({ r: buildResultsQuery(state) })
            .orderBy(({ r }) => r.timestamp, "desc")
            .limit(10),
        })
      : q.from({ r: buildResultsQuery(state) });

    if (isGroupByDay) {
      query = query.groupBy(({ r }) => r.dayTimestamp);
    }

    return query.select(({ r }) => ({
      dayTimestamp: isGroupByDay ? r.dayTimestamp : undefined,
      words: sum(r.words),
      completed: count(r._id),
      restarted: sum(r.restartCount),
      timeTyping: sum(r.timeTyping),
      maxWpm: max(r.wpm),
      avgWpm: avg(r.wpm),
      maxRaw: max(r.rawWpm),
      avgRaw: avg(r.rawWpm),
      maxAcc: max(r.acc),
      avgAcc: avg(r.acc),
      maxConsistency: max(r.consistency),
      avgConsistency: avg(r.consistency),
    }));
  });
}

/**
 * get list of SnapshotResults for the current result selection
 * @param queryState
 * @returns
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
export function useResultsLiveQuery(options: {
  queryState: Accessor<ResultsQueryState | undefined>;
  sorting: Accessor<{
    field: keyof SnapshotResult<Mode>;
    direction: "asc" | "desc";
  }>;
  limit: Accessor<number>;
}) {
  return useLiveQuery((q) => {
    const state = options.queryState();
    const sorting = options.sorting();
    const limit = options.limit();
    if (state === undefined) return undefined;

    return q
      .from({ r: buildResultsQuery(state) })
      .orderBy(({ r }) => r[sorting.field], sorting.direction)
      .limit(limit);
  });
}

function normalizeResult(
  result: ResultMinified | SnapshotResult<Mode>,
  _knownTagIds?: Set<string>,
): SnapshotResult<Mode> {
  const resultDate = new Date(result.timestamp);
  resultDate.setSeconds(0);
  resultDate.setMinutes(0);
  resultDate.setHours(0);
  resultDate.setMilliseconds(0);

  //@ts-expect-error without this somehow the collections is missing data
  result.id = result._id;
  //results strip default values, add them back
  result.bailedOut ??= false;
  result.blindMode ??= false;
  result.lazyMode ??= false;
  result.difficulty ??= "normal";
  result.funbox ??= [];
  result.language ??= "english";
  result.numbers ??= false;
  result.punctuation ??= false;
  result.numbers ??= false;
  result.quoteLength ??= -1;
  result.restartCount ??= 0;
  result.incompleteTestSeconds ??= 0;
  result.afkDuration ??= 0;

  result.tags ??= [];
  //TODO cleanup here or on display? join with tags collection?
  /*
  if (knownTagIds !== undefined) {
    result.tags = result.tags.filter((tagId) => knownTagIds.has(tagId));
  }
  */
  result.isPb ??= false;
  return {
    ...result,
    timeTyping: calcTimeTyping(result),
    words: Math.round((result.wpm / 60) * result.testDuration),
    dayTimestamp: resultDate.getTime(),
  } as SnapshotResult<Mode>;
}

const resultsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    queryFn: async () => {
      if (!isAuthenticated()) return [];
      const knownTagIds = new Set(
        tagsNonReactive.getTags().map((it) => it._id),
      );
      //const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);

      const response = await Ape.results.get({
        //query: { limit: options.limit },
      });

      if (response.status !== 200) {
        throw new Error("Error fetching results:" + response.body.message);
      }

      return response.body.data.map((result) =>
        normalizeResult(result, knownTagIds),
      );
    },
    queryClient,
    getKey: (it) => it._id,
  }),
);

type ActionType = {
  updateTags: {
    resultId: string;
    tagIds: string[];
    //TODO: remove when result page  is migrated to solidjs
    afterUpdate: (params: { tagPbs: string[] }) => void;
  };
  insertLocalResult: {
    result: SnapshotResult<Mode>;
  };
};

const actions = {
  updateTags: createOptimisticAction<ActionType["updateTags"]>({
    onMutate: ({ resultId, tagIds }) => {
      resultsCollection.update(resultId, (result) => {
        result.tags = tagIds;
      });
    },
    mutationFn: async ({ resultId, tagIds, afterUpdate }) => {
      const response = await Ape.results.updateTags({
        body: { resultId, tagIds },
      });
      if (response.status !== 200) {
        throw new Error(
          `Failed to update result tag: ${response.body.message}`,
        );
      }
      const results = getResults();
      const result = results.find((it) => it._id === resultId);

      if (result === undefined) {
        throw new Error(`Cannot find result with id ${resultId}`);
      }

      const tagsToUpdate = [
        ...result.tags.filter((tag) => !tagIds.includes(tag)),
        ...tagIds.filter((tag) => !result.tags.includes(tag)),
      ];
      tagsToUpdate.forEach((tag) => {
        updateLocalTagPB(
          tag,
          result.mode,
          result.mode2,
          result.punctuation,
          result.numbers,
          result.language,
          result.difficulty,
          result.lazyMode,
          results,
        );
      });

      afterUpdate({ tagPbs: response.body.data.tagPbs });
    },
  }),
  insertLocalResult: createOptimisticAction<ActionType["insertLocalResult"]>({
    onMutate: ({ result }) => {
      resultsCollection.insert(result);
    },
    mutationFn: async ({ result }) => {
      resultsCollection.utils.writeInsert(normalizeResult(result));
    },
  }),
};
// --- Public API ---
export async function updateTags(
  params: ActionType["updateTags"],
): Promise<void> {
  const transaction = actions.updateTags(params);
  await transaction.isPersisted.promise;
}

export async function insertLocalResult(
  params: ActionType["insertLocalResult"],
): Promise<void> {
  if (!resultsCollection.isReady()) {
    //not loaded yet, don't need to insert
    return;
  }
  const transaction = actions.insertLocalResult(params);
  await transaction.isPersisted.promise;
}

// oxlint-disable-next-line typescript/explicit-function-return-type
export function buildResultsQuery(state: ResultsQueryState) {
  const applyMode2Filter = <T extends "time" | "words">(
    key: T,
    filter: ResultsQueryState[T],
    nonCustomValues: string[],
  ): void => {
    if (filter.length === 5) return;
    const isCustom = filter.includes("custom");
    const selected = filter.filter((it) => it !== "custom");
    query = query.where(({ r }) =>
      or(
        //results not matching the mode pass
        not(eq(r.mode, key)),

        //mode2 is matching one of the  selected mode2
        inArray(r.mode2, selected),
        //or if custom selected are not matching any non-custom value
        isCustom ? not(inArray(r.mode2, nonCustomValues)) : false,
      ),
    );
  };

  let query = new Query()
    .from({ r: resultsCollection })
    .where(({ r }) => gte(r.timestamp, state.timestamp))
    .where(({ r }) => inArray(r.difficulty, state.difficulty))
    .where(({ r }) => inArray(r.isPb, state.pb))
    .where(({ r }) => inArray(r.mode, state.mode))
    .where(({ r }) => inArray(r.punctuation, state.punctuation))
    .where(({ r }) => inArray(r.numbers, state.numbers))
    .where(({ r }) => inArray(r.quoteLength, state.quoteLength))
    .where(({ r }) => inArray(r.language, state.language))
    .where(({ r }) =>
      or(
        false,
        false,
        ...state.tags.map((tag) =>
          tag === "none" ? eq(length(r.tags), 0) : inArray(tag, r.tags),
        ),
      ),
    )
    .where(({ r }) =>
      or(
        false,
        false,
        ...state.funbox.map((fb) =>
          (fb as string) === "none"
            ? eq(length(r.funbox), 0)
            : inArray(fb, r.funbox),
        ),
      ),
    );
  applyMode2Filter("time", state.time, ["15", "30", "60", "120"]);
  applyMode2Filter("words", state.words, ["10", "25", "50", "100"]);

  return query;
}

export function createResultsQueryState(
  filters: ResultFilters,
): ResultsQueryState {
  return {
    difficulty: valueFilter(filters.difficulty),
    pb: boolFilter(filters.pb),
    mode: valueFilter(filters.mode),
    words: valueFilter(filters.words),
    time: valueFilter(filters.time),
    punctuation: boolFilter(filters.punctuation),
    numbers: boolFilter(filters.numbers),
    timestamp: timestampFilter(filters.date),
    quoteLength: [
      ...valueFilter(filters.quoteLength, {
        short: 0,
        medium: 1,
        long: 2,
        thicc: 3,
      }),
      -1, // fallback value for results without quoteLength, set in the collection
    ],
    tags: valueFilter(filters.tags),
    funbox: valueFilter(filters.funbox),
    language: valueFilter(filters.language),
  };
}

function valueFilter<T extends string, U = T>(
  val: Partial<Record<T, boolean>>,
  mapping?: Record<T, U>,
): U[] {
  return Object.entries(val)
    .filter(([_, v]) => v === true)
    .map(([k]) => k as T)
    .map((it) => (mapping ? mapping[it] : (it as unknown as U)));
}

function boolFilter(
  val: Record<"on" | "off", boolean> | Record<"yes" | "no", boolean>,
): boolean[] {
  return Object.entries(val)
    .filter(([_, v]) => v)
    .map(([k]) => k === "on" || k === "yes");
}

function timestampFilter(val: ResultFilters["date"]): number {
  const seconds =
    valueFilter(val, {
      all: 0,
      last_day: 24 * 60 * 60,
      last_week: 7 * 24 * 60 * 60,
      last_month: 30 * 24 * 60 * 60,
      last_3months: 90 * 24 * 60 * 60,
    })[0] ?? 0;

  if (seconds === 0) return 0;
  return Math.floor(Date.now() - seconds * 1000);
}

function calcTimeTyping(result: ResultMinified): number {
  let tt = 0;
  if (
    result.testDuration === undefined &&
    result.mode2 !== "custom" &&
    result.mode2 !== "zen"
  ) {
    //test finished before testDuration field was introduced - estimate
    if (result.mode === "time") {
      tt = parseInt(result.mode2);
    } else if (result.mode === "words") {
      tt = (parseInt(result.mode2) / result.wpm) * 60;
    }
  } else {
    tt = parseFloat(result.testDuration as unknown as string); //legacy results could have a string here
  }
  if (result.incompleteTestSeconds !== undefined) {
    tt += result.incompleteTestSeconds;
  } else if (result.restartCount !== undefined && result.restartCount > 0) {
    tt += (tt / 4) * result.restartCount;
  }
  return tt;
}

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getSingleResultQueryOptions = (_id: string) =>
  queryOptions({
    queryKey: queryKeys.fullResult(_id),
    queryFn: async () => {
      const response = await Ape.results.getById({ params: { resultId: _id } });

      if (response.status !== 200) {
        throw new Error(`Failed to load result: ${response.body.message}`);
      }
      return response.body.data;
    },
    staleTime: Infinity,
  });

export type CurrentSettingsFilter = {
  mode: Mode;
  mode2: Mode2<Mode>;
  punctuation: boolean;
  numbers: boolean;
  language: string;
  difficulty: Difficulty;
  lazyMode: boolean;
};

export async function getUserAverage(
  options: CurrentSettingsFilter &
    ExactlyOneTrue<{
      last10Only: boolean;
      lastDayOnly: boolean;
    }>,
): Promise<{ wpm: number; acc: number }> {
  const activeTagIds = tagsNonReactive.getActiveTags().map((it) => it._id);

  const result = await createLiveQueryCollection((q) => {
    let query = q
      .from({ r: buildSettingsResultsQuery(options) })
      .where(({ r }) =>
        or(
          false,
          activeTagIds.length === 0,
          ...activeTagIds.map((it) => inArray(it, r.tags)),
        ),
      );

    if (options.lastDayOnly) {
      query = query.where(({ r }) => gte(r.timestamp, Date.now() - 86400000));
    }
    if (options.last10Only) {
      query = query.orderBy(({ r }) => r.timestamp).limit(10);
    }

    return query.select(({ r }) => ({ wpm: avg(r.wpm), acc: avg(r.acc) }));
  }).toArrayWhenReady();

  return result.length === 1 && result[0] !== undefined
    ? result[0]
    : { wpm: 0, acc: 0 };
}

export async function findFastestResultByTagId(
  options: CurrentSettingsFilter & { tagId: string },
): Promise<SnapshotResult<Mode> | undefined> {
  const result = await createLiveQueryCollection((q) =>
    q
      .from({ r: buildSettingsResultsQuery(options) })
      .where(({ r }) => inArray(options.tagId, r.tags))
      .orderBy(({ r }) => r.wpm, "desc")
      .limit(1)
      .findOne(),
  ).toArrayWhenReady();
  return result.length === 1 && result[0] !== undefined
    ? (result[0] as SnapshotResult<Mode>)
    : undefined;
}

// oxlint-disable-next-line typescript/explicit-function-return-type
function buildSettingsResultsQuery(filter: CurrentSettingsFilter) {
  return new Query()
    .from({ r: resultsCollection })
    .where(({ r }) => eq(r.mode, filter.mode))
    .where(({ r }) => eq(r.mode2, filter.mode2))
    .where(({ r }) => eq(r.punctuation, filter.punctuation))
    .where(({ r }) => eq(r.numbers, filter.numbers))
    .where(({ r }) => eq(r.language, filter.language))
    .where(({ r }) => eq(r.difficulty, filter.difficulty))
    .where(({ r }) => eq(r.lazyMode, filter.lazyMode));
}

export function deleteLocalTag(tagId: string): void {
  for (const result of resultsCollection.values()) {
    if (!result.tags.includes(tagId)) continue;
    resultsCollection.update(result._id, (old) => {
      const tags = old.tags.filter((it) => it !== tagId);
      old.tags = tags;
    });
  }
}

export function isResultsReady(): boolean {
  return resultsCollection.isReady();
}

export async function waitForResultsReady(): Promise<void> {
  await resultsCollection.stateWhenReady();
}

export function getResultsSize(): number {
  return resultsCollection.size;
}

/**
 *
 */
createEffectOn(isAuthenticated, (hasUser) => {
  if (hasUser) {
    void resultsCollection.utils.refetch();
  }
});

function getResults(): SnapshotResult<Mode>[] {
  return [...resultsCollection.values()];
}
/**
 * Used for non reactive access. Do not use in Solid components.
 */
export const __nonReactive = {
  getResults,
};
