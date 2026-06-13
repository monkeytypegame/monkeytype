import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/solid-db";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { isAuthenticated } from "../states/core";
import { setApeKeysDenied } from "../states/account-settings";
import { applyIdWorkaround } from "./utils/misc";
import { typedEntries } from "../utils/misc";
import { ApeKey } from "@monkeytype/schemas/ape-keys";
import { showSuccessNotification } from "../states/notifications";
import { replaceUnderscoresWithSpaces } from "../utils/strings";

export type ApeKeyEntry = ApeKey & { _id: string };
const queryKeys = {
  root: () => [...baseKey("apeKeys", { isUserSpecific: true })],
};

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useApeKeyLiveQuery() {
  return useLiveQuery((q) =>
    q
      .from({ keys: apeKeysCollection })
      .orderBy(({ keys }) => keys.createdOn, "asc"),
  );
}

const apeKeysCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    queryClient,
    enabled: isAuthenticated,
    getKey: (it) => it._id,
    queryFn: async () => {
      const response = await Ape.apeKeys.get();

      if (response.status !== 200) {
        if (
          response.body.message ===
          "You have lost access to ape keys, please contact support"
        ) {
          setApeKeysDenied(true);
        }

        throw new Error(`Error fetching ape keys:${response.body.message}`);
      }

      const dataArray = typedEntries(response.body.data)
        .map(
          ([_id, data]) =>
            ({
              ...data,
              _id,
              name: replaceUnderscoresWithSpaces(data.name),
            }) satisfies ApeKeyEntry,
        )
        .map(applyIdWorkaround);

      return dataArray;
    },
  }),
);

type ActionType = {
  setEnabled: { apeKeyId: string; enabled: boolean };
  rename: { apeKeyId: string; name: string };
  remove: { apeKeyId: string };
};

const actions = {
  setEnabled: createOptimisticAction<ActionType["setEnabled"]>({
    onMutate: ({ apeKeyId, enabled }) => {
      apeKeysCollection.update(apeKeyId, (key) => {
        key.enabled = enabled;
      });
    },
    mutationFn: async ({ apeKeyId, enabled }) => {
      const response = await Ape.apeKeys.save({
        params: { apeKeyId },
        body: { enabled },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to update key: ${response.body.message}`);
      }

      apeKeysCollection.utils.writeUpdate({ _id: apeKeyId, enabled });

      showSuccessNotification(`Key ${enabled ? "active" : "inactive"}`);
    },
  }),
  rename: createOptimisticAction<ActionType["rename"]>({
    onMutate: ({ apeKeyId, name }) => {
      apeKeysCollection.update(apeKeyId, (key) => {
        key.name = name;
      });
    },
    mutationFn: async ({ apeKeyId, name }) => {
      const response = await Ape.apeKeys.save({
        params: { apeKeyId },
        body: { name },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to update key: ${response.body.message}`);
      }

      apeKeysCollection.utils.writeUpdate({ _id: apeKeyId, name });
    },
  }),
  remove: createOptimisticAction<ActionType["remove"]>({
    onMutate: ({ apeKeyId }) => {
      apeKeysCollection.delete(apeKeyId);
    },
    mutationFn: async ({ apeKeyId }) => {
      const response = await Ape.apeKeys.delete({ params: { apeKeyId } });
      if (response.status !== 200) {
        throw new Error(`Failed to delete key: ${response.body.message}`);
      }

      apeKeysCollection.utils.writeDelete(apeKeyId);
    },
  }),
};

export async function updateApeKeyEnabled(
  params: ActionType["setEnabled"],
): Promise<void> {
  const transaction = actions.setEnabled(params);
  await transaction.isPersisted.promise;
}

export async function renameApeKey(
  params: ActionType["rename"],
): Promise<void> {
  const transaction = actions.rename(params);
  await transaction.isPersisted.promise;
}

export async function removeApeKey(
  params: ActionType["remove"],
): Promise<void> {
  const transaction = actions.remove(params);
  await transaction.isPersisted.promise;
}
