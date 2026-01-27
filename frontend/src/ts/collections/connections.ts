import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./client";

import Ape from "../ape";

import { isLoggedIn } from "../signals/core";
import { addToGlobal, sleep } from "../utils/misc";

export const connectionsCollection = createCollection(
  queryCollectionOptions({
    syncMode: "on-demand",
    queryClient,
    queryKey: ["connections"],
    getKey: (item) => item._id,
    staleTime: 10,
    startSync: true,
    queryFn: async () => {
      if (!isLoggedIn()) return [];
      const response = await Ape.connections.get();
      if (response.status !== 200) {
        throw new Error("Error fetching connections:" + response.body.message);
      }
      console.log("### Loaded connections", response.body.data.length);
      return response.body.data;
    },
    onUpdate: async ({ transaction }) => {
      await sleep(2000);
      for (const update of transaction.mutations) {
        const id = update.key;
        const patch = update.changes;
        console.log("### sync", { id, patch });
      }
    },
  }),
);

addToGlobal({ cc: connectionsCollection });
