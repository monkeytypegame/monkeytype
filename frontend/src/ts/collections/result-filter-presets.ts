import { ResultFilters } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { showErrorNotification } from "../stores/notifications";

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
      //return emtpy array. We load the user with the snapshot and fill the collection from there
      return [] as ResultFilters[];
    },
    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified);

      const serverItems = await Promise.all(
        newItems.map(async (it) => {
          const response = await Ape.users.addResultFilterPreset({ body: it });
          if (response.status !== 200) {
            showErrorNotification(
              `Failed to insert result filter presets: ${response.body.message}`,
            );
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
            showErrorNotification(
              `Failed to delete result filter presets: ${response.body.message}`,
            );
            throw new Error(
              `Failed to delete result filter presets: ${response.body.message}`,
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
