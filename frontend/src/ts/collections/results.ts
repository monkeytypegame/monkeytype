import { Mode } from "@monkeytype/schemas/shared";
import { ResultFilters } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  inArray,
  InitialQueryBuilder,
  useLiveQuery,
} from "@tanstack/solid-db";
import { createMemo } from "solid-js";
import Ape from "../ape";
import { SnapshotResult } from "../constants/default-snapshot";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";

export type SortDirection = "asc" | "desc";

export type ResultsSortField = keyof SnapshotResult<Mode>;
type ResultsQueryState = {
  difficulty: SnapshotResult<Mode>["difficulty"][];
  pb: SnapshotResult<Mode>["isPb"][];
  mode: SnapshotResult<Mode>["mode"][];
  mode2: SnapshotResult<Mode>["mode2"][];
  punctuation: SnapshotResult<Mode>["punctuation"][];
  numbers: SnapshotResult<Mode>["numbers"][];
  sortField: ResultsSortField;
  sortDirection: SortDirection;
  limit: number;
};

const queryKeys = {
  root: () => [...baseKey("results", { isUserSpecific: true }), Math.random()],
};

export const resultsCollection = createCollection(
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
        return result as SnapshotResult<Mode>;
      });
    },
    queryClient,
    getKey: (it) => it._id,
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useResultsLiveQuery(params: {
  enabled: () => boolean;
  filters: () => ResultFilters;
  sorting: () => {
    field: ResultsSortField;
    direction: SortDirection;
  };
  limit: () => number;
}) {
  const queryState = createMemo(() => {
    if (!params.enabled()) {
      return undefined;
    }

    return createResultsQueryState(
      params.filters(),
      params.sorting(),
      params.limit(),
    );
  });

  return useLiveQuery((q) => {
    const state = queryState();
    if (state === undefined) return undefined;
    return buildResultsQuery(state)(q);
  });
}

function buildResultsQuery(state: ResultsQueryState) {
  return (q: InitialQueryBuilder) =>
    q
      .from({ r: resultsCollection })
      .where(({ r }) => inArray(r.difficulty, state.difficulty))
      .where(({ r }) => inArray(r.isPb, state.pb))
      .where(({ r }) => inArray(r.mode, state.mode))
      .where(({ r }) => inArray(r.mode2, state.mode2))
      .where(({ r }) => inArray(r.punctuation, state.punctuation))
      .where(({ r }) => inArray(r.numbers, state.numbers))
      .orderBy(({ r }) => r[state.sortField], state.sortDirection)
      .limit(state.limit);
}

function createResultsQueryState(
  filters: ResultFilters,
  sorting: { field: ResultsSortField; direction: SortDirection },
  limit: number,
): ResultsQueryState {
  return {
    difficulty: valueFilter(filters.difficulty),
    pb: boolFilter(filters.pb),
    mode: valueFilter(filters.mode),
    mode2: [...valueFilter(filters.words), ...valueFilter(filters.time)],
    punctuation: boolFilter(filters.punctuation),
    numbers: boolFilter(filters.numbers),
    sortField: sorting.field,
    sortDirection: sorting.direction,
    limit,
  };
}

function valueFilter<T extends string>(val: Partial<Record<T, boolean>>): T[] {
  return Object.entries(val)
    .filter(([_, v]) => v as boolean) //TODO remove as?
    .map(([k]) => k as T);
}

function boolFilter(
  val: Record<"on" | "off", boolean> | Record<"yes" | "no", boolean>,
): boolean[] {
  return Object.entries(val)
    .filter(([_, v]) => v)
    .map(([k]) => k === "on" || k === "yes");
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
