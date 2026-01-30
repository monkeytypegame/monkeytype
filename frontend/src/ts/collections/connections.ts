import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./client";

import Ape from "../ape";

import { createEffectOn } from "../hooks/effects";
import { getActivePage, isLoggedIn } from "../signals/core";
import { addToGlobal } from "../utils/misc";

createEffectOn(getActivePage, (page) => {
  //refresh connections when entering the friends page
  if (page === "friends") {
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
  }
});

export const connectionsCollection = createCollection(
  queryCollectionOptions({
    syncMode: "on-demand",
    queryClient,
    queryKey: ["connections"],
    getKey: (item) => item._id,
    queryFn: async () => {
      if (!isLoggedIn()) return [];
      const response = await Ape.connections.get();
      if (response.status !== 200) {
        throw new Error("Error fetching connections:" + response.body.message);
      }

      return response.body.data;
    },
    onUpdate: async ({ transaction }) => {
      for (const update of transaction.mutations) {
        const id = update.key as string;
        const patch = update.changes;
        if (patch.status !== undefined && patch.status !== "pending") {
          const result = await Ape.connections.update({
            params: { id },
            body: { status: patch.status },
          });
          if (result.status !== 200) {
            throw new Error(
              `Cannot update friend request: ${result.body.message}`,
            );
          }
        }
      }
    },
    onDelete: async ({ transaction }) => {
      for (const remove of transaction.mutations) {
        const id = remove.key as string;

        const result = await Ape.connections.delete({
          params: { id },
        });
        if (result.status !== 200) {
          throw new Error(`Cannot remove request: ${result.body.message}`);
        }
      }
    },
  }),
);

addToGlobal({ cc: connectionsCollection });
