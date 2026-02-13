import { baseKey } from "../queries/utils/keys";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "../queries";
import Ape from "../ape";
import { SnapshotResult } from "../constants/default-snapshot";
import { Mode } from "@monkeytype/schemas/shared";
import { createCollection } from "@tanstack/solid-db";
import { addToGlobal } from "../utils/misc";

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
        result.id = result._id;
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
addToGlobal({ resultsCollection });

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
