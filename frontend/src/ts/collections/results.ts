import { ResultMinified } from "@monkeytype/schemas/results";
import { Mode } from "@monkeytype/schemas/shared";
import { ResultFilters } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  and,
  avg,
  count,
  createCollection,
  createLiveQueryCollection,
  eq,
  gte,
  inArray,
  max,
  not,
  or,
  sum,
  useLiveQuery,
} from "@tanstack/solid-db";
import { Accessor } from "solid-js";
import Ape from "../ape";
import { SnapshotResult } from "../constants/default-snapshot";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";

type SortDirection = "asc" | "desc";
type ResultsSortField = keyof SnapshotResult<Mode>;
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
  sortField: ResultsSortField;
  sortDirection: SortDirection;
  limit: number;
};

const queryKeys = {
  root: () => [...baseKey("results", { isUserSpecific: true })],
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
  options?: { lastTen?: true },
) {
  return useLiveQuery((q) => {
    const state = queryState();
    if (state === undefined) return undefined;

    return (
      options?.lastTen
        ? //for lastTen we need a sub-query to apply the sort+limit first and then run the aggregations
          q.from({
            r: q
              .from({ r: getFilteredResults(state) })
              .orderBy(({ r }) => r.timestamp, "desc")
              .limit(10),
          })
        : q.from({ r: getFilteredResults(state) })
    ).select(({ r }) => ({
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
export function useResultsLiveQuery(
  queryState: Accessor<ResultsQueryState | undefined>,
) {
  return useLiveQuery((q) => {
    const state = queryState();
    if (state === undefined) return undefined;
    return q
      .from({ r: getFilteredResults(state) })
      .orderBy(({ r }) => r[state.sortField], state.sortDirection)
      .limit(state.limit);
  });
}

const resultsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    queryFn: async () => {
      //const options = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);

      const response = await Ape.results.get({
        //query: { limit: options.limit },
      });

      if (response.status !== 200) {
        throw new Error("Error fetching results:" + response.body.message);
      }

      return response.body.data.map((result) => {
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
        result.isPb ??= false;
        return {
          ...result,
          timeTyping: calcTimeTyping(result),
          words: Math.round((result.wpm / 60) * result.testDuration),
        } as SnapshotResult<Mode>;
      });
    },
    queryClient,
    getKey: (it) => it._id,
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
function getFilteredResults(state: ResultsQueryState) {
  return createLiveQueryCollection((q) => {
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
          inArray(
            r.mode,
            ["time", "words", "quote", "custom", "zen"].filter(
              (it) => it !== key,
            ),
          ),
          and(
            eq(r.mode, key),
            or(
              //mode2 is matching one ofthe selected mode2
              inArray(r.mode2, selected),
              //or if custom selected are not matching any non-custom value
              isCustom ? not(inArray(r.mode2, nonCustomValues)) : false,
            ),
          ),
        ),
      );
    };

    let query = q
      .from({ r: resultsCollection })
      .where(({ r }) => gte(r.timestamp, state.timestamp))
      .where(({ r }) => inArray(r.difficulty, state.difficulty))
      .where(({ r }) => inArray(r.isPb, state.pb))
      .where(({ r }) => inArray(r.mode, state.mode))
      .where(({ r }) => inArray(r.punctuation, state.punctuation))
      .where(({ r }) => inArray(r.numbers, state.numbers))
      .where(({ r }) => inArray(r.quoteLength, state.quoteLength));

    applyMode2Filter("time", state.time, ["15", "30", "60", "120"]);
    applyMode2Filter("words", state.words, ["10", "25", "50", "100"]);

    return query;
  });
}

export function createResultsQueryState(
  filters: ResultFilters,
  sorting: { field: ResultsSortField; direction: SortDirection },
  limit: number,
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
    sortField: sorting.field,
    sortDirection: sorting.direction,
    limit,
  };
}

function valueFilter<T extends string, U = T>(
  val: Partial<Record<T, boolean>>,
  mapping?: Record<T, U>,
): U[] {
  return Object.entries(val)
    .filter(([_, v]) => v as boolean) //TODO remove as?
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

function singleFilter<T extends string, U>(
  val: Partial<Record<T, boolean>>,
  mapping: Record<T, U>,
): U | undefined {
  const active = Object.entries(val).find(([_, v]) => v as boolean);
  const result = active === undefined ? undefined : mapping[active[0] as T];
  return result;
}

function timestampFilter(val: ResultFilters["date"]): number {
  const seconds =
    singleFilter(val, {
      all: 0,
      last_day: 24 * 60 * 60,
      last_week: 7 * 24 * 60 * 60,
      last_month: 30 * 24 * 60 * 60,
      last_3months: 90 * 24 * 60 * 60,
    }) ?? 0;

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

/*
const allResultsQuery = createCollection(
  liveQueryCollectionOptions({
    query: (q) => q.from({ results: resultsCollection }),
  }),
);

export async function downloadResults(): Promise<void> {
  await allResultsQuery.stateWhenReady();
  return;
}

export function getAllResults<M extends Mode>(): SnapshotResult<M>[] {
  return allResultsQuery.toArray as SnapshotResult<M>[];
}
*/
