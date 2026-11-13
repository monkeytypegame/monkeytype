import { ResultFilters } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import {
  replaceSpacesWithUnderscores,
  replaceUnderscoresWithSpaces,
} from "../utils/strings";
import { tempId, keepForever } from "./utils/misc";
import { isAuthenticated } from "../states/core";

const queryKeys = {
  root: () => [...baseKey("resultFilterPresets", { isUserSpecific: true })],
};

/** The presets from the last user download, which fills this collection. */
let downloaded: ResultFilters[] = [];

const resultFilterPresetsCollection = createCollection({
  ...queryCollectionOptions({
    ...keepForever,
    staleTime: Infinity,
    startSync: true,
    queryKey: queryKeys.root(),
    queryClient,
    enabled: isAuthenticated,
    getKey: (it) => it._id,
    // filled from the user download (same endpoint), see `fillResultFilterPresets`
    queryFn: async () => structuredClone(downloaded),
  }),
  ...keepForever,
});

/**
 * Fills the presets from the user download (server names, with underscores).
 * The collection's query is created disabled (startSync runs at module load,
 * before the auth state resolves) and never re-evaluates `enabled` on its own,
 * so this kicks it.
 */
export function fillResultFilterPresets(presets: ResultFilters[]): void {
  downloaded = presets.map((it) => ({
    ...it,
    name: replaceUnderscoresWithSpaces(it.name),
  }));
  void resultFilterPresetsCollection.utils.refetch();
}

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useResultFilterPresetsLiveQuery() {
  return useLiveQuery((q) => {
    if (!isAuthenticated()) return undefined;
    return q.from({ presets: resultFilterPresetsCollection });
  });
}

type ActionType = {
  insertResultFilterPreset: {
    name: string;
    filters: ResultFilters;
  };
  deleteResultFilterPreset: {
    presetId: string;
  };
};

const actions = {
  insertResultFilterPreset: createOptimisticAction<
    ActionType["insertResultFilterPreset"]
  >({
    onMutate: ({ name, filters }) => {
      resultFilterPresetsCollection.insert({
        ...structuredClone(filters),
        _id: tempId(),
        name,
      });
    },
    mutationFn: async ({ name, filters }) => {
      const response = await Ape.users.addResultFilterPreset({
        body: {
          ...structuredClone(filters),
          name: replaceSpacesWithUnderscores(name),
        },
      });
      if (response.status !== 200) {
        throw new Error(
          `Failed to insert result filter presets: ${response.body.message}`,
        );
      }

      const newPreset: ResultFilters = {
        ...structuredClone(filters),
        _id: response.body.data,
        name,
      };

      await resultFilterPresetsCollection.utils.writeInsert(newPreset);
    },
  }),
  deleteResultFilterPreset: createOptimisticAction<
    ActionType["deleteResultFilterPreset"]
  >({
    onMutate: ({ presetId }) => {
      resultFilterPresetsCollection.delete(presetId);
    },
    mutationFn: async ({ presetId }) => {
      const response = await Ape.users.removeResultFilterPreset({
        params: { presetId },
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to delete result filter presets: ${response.body.message}`,
        );
      }

      await resultFilterPresetsCollection.utils.writeDelete(presetId);
    },
  }),
};

export async function insertResultFilterPreset(
  params: ActionType["insertResultFilterPreset"],
): Promise<void> {
  const transaction = actions.insertResultFilterPreset(params);
  await transaction.when("settled");
}

export async function deleteResultFilterPreset(
  params: ActionType["deleteResultFilterPreset"],
): Promise<void> {
  const transaction = actions.deleteResultFilterPreset(params);
  await transaction.when("settled");
}
