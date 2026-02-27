import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";
import { getSnapshot } from "../db";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import { addToGlobal } from "../utils/misc";

const queryKeys = {
  root: () => [...baseKey("resultFilterPresets", { isUserSpecific: true })],
};

export const resultFilterPresetsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      const fromSnapshot = getSnapshot()?.filterPresets;
      if (fromSnapshot !== undefined) return fromSnapshot;

      const response = await Ape.users.get();
      if (response.status !== 200) {
        throw new Error(
          `Failed to load result filter presets: ${response.body.message}`,
        );
      }

      return response.body.data.resultFilterPresets ?? [];
    },
    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const serverItems = await Promise.all(
        newItems.map(async (it) => {
          const response = await Ape.users.addResultFilterPreset({ body: it });
          if (response.status !== 200) {
            throw new Error(
              `Failed to insert result filter presets: ${response.body.message}`,
            );
          }
          return { ...it, _id: response.body.data };
        }),
      );

      resultFilterPresetsCollection.utils.writeBatch(() => {
        serverItems.forEach((it) =>
          resultFilterPresetsCollection.utils.writeInsert(it),
        );
      });
      return { refetch: false };
    },
    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((it) => it.key as string);

      await Promise.all(
        ids.map(async (it) => {
          const response = await Ape.users.removeResultFilterPreset({
            params: { presetId: it },
          });
          if (response.status !== 200) {
            Notifications.add(
              "Error deleting filter preset: " + response.body.message,
              -1,
            );
            throw new Error(
              "Error deleting filter preset: " + response.body.message,
            );
          }
        }),
      );

      resultFilterPresetsCollection.utils.writeBatch(() => {
        ids.forEach((it) =>
          resultFilterPresetsCollection.utils.writeDelete(it),
        );
      });
      //don't refetch
      return { refetch: false };
    },
  }),
);

addToGlobal({ rc: resultFilterPresetsCollection });
