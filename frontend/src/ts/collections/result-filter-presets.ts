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
import { tempId } from "./utils/misc";

const queryKeys = {
  root: () => [...baseKey("resultFilterPresets", { isUserSpecific: true })],
};

const resultFilterPresetsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),

    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      //return emtpy array. We load the user with the snapshot and fill the collection from there
      return [] as ResultFilters[];
    },
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useResultFilterPresetsLiveQuery() {
  return useLiveQuery((q) =>
    q.from({ presets: resultFilterPresetsCollection }),
  );
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

      resultFilterPresetsCollection.utils.writeInsert(newPreset);
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

      resultFilterPresetsCollection.utils.writeDelete(presetId);
    },
  }),
};

export async function insertResultFilterPreset(
  params: ActionType["insertResultFilterPreset"],
): Promise<void> {
  const transaction = actions.insertResultFilterPreset(params);
  await transaction.isPersisted.promise;
}

export async function deleteResultFilterPreset(
  params: ActionType["deleteResultFilterPreset"],
): Promise<void> {
  const transaction = actions.deleteResultFilterPreset(params);
  await transaction.isPersisted.promise;
}

export function fillResultFilterPresetsCollection(
  presets: ResultFilters[],
): void {
  resultFilterPresetsCollection.utils.writeBatch(() => {
    presets
      .map((it) => ({ ...it, name: replaceUnderscoresWithSpaces(it.name) }))
      .forEach((it) => resultFilterPresetsCollection.utils.writeInsert(it));
  });
}
