import {
  and,
  createCollection,
  eq,
  useLiveQuery,
  not,
  createOptimisticAction,
} from "@tanstack/solid-db";
import { baseKey } from "../queries/utils/keys";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "../queries";
import Ape from "../ape";
import { applyIdWorkaround } from "./utils/misc";
import { getUserId, isAuthenticated } from "../states/core";

const queryKeys = {
  root: () => [...baseKey("connections", { isUserSpecific: true })],
};

const connectionsCollection = createCollection(
  queryCollectionOptions({
    staleTime: 5 * 60 * 1000,
    queryKey: queryKeys.root(),
    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      if (!isAuthenticated()) return [];
      const response = await Ape.connections.get();
      if (response.status !== 200) {
        throw new Error(`Error fetching connections:${response.body.message}`);
      }

      return response.body.data.map(applyIdWorkaround);
    },
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function usePendingConnectionsQuery() {
  return useLiveQuery((q) =>
    q
      .from({ connections: connectionsCollection })
      .where(({ connections }) =>
        and(
          eq(connections.status, "pending"),
          not(eq(connections.initiatorUid, getUserId())),
        ),
      )
      .orderBy(({ connections }) => connections.lastModified, "desc"),
  );
}

type ActionType = {
  acceptConnection: {
    id: string;
  };
  rejectConnection: {
    id: string;
  };
  blockConnection: {
    id: string;
  };
};

const actions = {
  acceptConnection: createOptimisticAction<ActionType["acceptConnection"]>({
    onMutate: ({ id }) => {
      connectionsCollection.update(id, (old) => (old.status = "accepted"));
    },
    mutationFn: async ({ id }) => {
      const response = await Ape.connections.update({
        params: { id },
        body: { status: "accepted" },
      });
      if (response.status !== 200) {
        throw new Error(
          `Failed to accept connection: ${response.body.message}`,
        );
      }
      connectionsCollection.utils.writeUpdate({
        _id: id,
        status: "accepted",
      });
    },
  }),
  blockConnection: createOptimisticAction<ActionType["blockConnection"]>({
    onMutate: ({ id }) => {
      connectionsCollection.update(id, (old) => (old.status = "blocked"));
    },
    mutationFn: async ({ id }) => {
      const response = await Ape.connections.update({
        params: { id },
        body: { status: "blocked" },
      });
      if (response.status !== 200) {
        throw new Error(`Failed to block connection: ${response.body.message}`);
      }
      connectionsCollection.utils.writeUpdate({
        _id: id,
        status: "blocked",
      });
    },
  }),
  rejectConnection: createOptimisticAction<ActionType["rejectConnection"]>({
    onMutate: ({ id }) => {
      connectionsCollection.delete(id);
    },
    mutationFn: async ({ id }) => {
      const response = await Ape.connections.delete({ params: { id } });
      if (response.status !== 200) {
        throw new Error(
          `Failed to reject connection: ${response.body.message}`,
        );
      }
      connectionsCollection.utils.writeDelete(id);
    },
  }),
};

// -- Public API ---
export function isConnectionsReady(): boolean {
  return connectionsCollection.isReady();
}

export async function waitForConnectionsReady(): Promise<void> {
  await connectionsCollection.stateWhenReady();
}

export async function acceptConnection(
  params: ActionType["acceptConnection"],
): Promise<void> {
  const transaction = actions.acceptConnection(params);
  await transaction.isPersisted.promise;
}

export async function rejectConnection(
  params: ActionType["rejectConnection"],
): Promise<void> {
  const transaction = actions.rejectConnection(params);
  await transaction.isPersisted.promise;
}

export async function blockConnection(
  params: ActionType["blockConnection"],
): Promise<void> {
  const transaction = actions.blockConnection(params);
  await transaction.isPersisted.promise;
}
