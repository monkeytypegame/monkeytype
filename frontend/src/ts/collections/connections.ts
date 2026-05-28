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
import { applyIdWorkaround, tempId } from "./utils/misc";
import { getUserId, isAuthenticated } from "../states/core";

import {
  configurationPromise,
  get as getServerConfiguration,
} from "../ape/server-configuration";
import { getSnapshot } from "../states/snapshot";
import { Connection } from "@monkeytype/schemas/connections";
import {
  addNotificationWithLevel,
  NotificationLevel,
  showNoticeNotification,
} from "../states/notifications";
import { invalidateFriendsList } from "../queries/friends";

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
      await configurationPromise;
      if (!getServerConfiguration()?.connections.enabled) return [];
      const response = await Ape.connections.get();
      if (response.status !== 200) {
        throw new Error(`Error fetching connections:${response.body.message}`);
      }

      return response.body.data.map(applyIdWorkaround);
    },
  }),
);

const connectionsQuery = useLiveQuery((q) =>
  q.from({ connections: connectionsCollection }),
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
// oxlint-disable-next-line typescript/explicit-function-return-type
export function useBlockedConnectionsQuery() {
  return useLiveQuery((q) =>
    q
      .from({ connections: connectionsCollection })
      .where(({ connections }) =>
        and(
          eq(connections.status, "blocked"),
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
  addConnection: {
    receiverName: string;
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

      await invalidateFriendsList();
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

      await invalidateFriendsList();
    },
  }),
  addConnection: createOptimisticAction<ActionType["addConnection"]>({
    onMutate: ({ receiverName }) => {
      connectionsCollection.insert({
        _id: tempId(),
        status: "pending",
        receiverName,
        receiverUid: tempId(),
        initiatorName: getSnapshot()?.name ?? "",
        initiatorUid: getSnapshot()?.uid ?? "",
        lastModified: Date.now(),
      });
    },
    mutationFn: async ({ receiverName }) => {
      const response = await Ape.connections.create({ body: { receiverName } });

      if (response.status === 200) {
        connectionsCollection.utils.writeInsert(response.body.data);
        showNoticeNotification(`Request sent to ${receiverName}`);
      } else {
        const result = response.body.message;
        let level: NotificationLevel = "error";
        let message = "Unknown error";

        if (result.includes("already exists")) {
          level = "notice";
          message = `You are already friends with ${receiverName}`;
        } else if (result.includes("request already sent")) {
          level = "notice";
          message = `You have already sent a friend request to ${receiverName}`;
        } else if (result.includes("blocked by initiator")) {
          level = "notice";
          message = `You have blocked ${receiverName}`;
        } else if (result.includes("blocked by receiver")) {
          level = "notice";
          message = `${receiverName} has blocked you`;
        }

        addNotificationWithLevel(message, level);
      }
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

export async function addConnection(
  params: ActionType["addConnection"],
): Promise<void> {
  const transaction = actions.addConnection(params);
  await transaction.isPersisted.promise;
}

export function hasConnection(
  uid: string | undefined,
  status?: Connection["status"],
): boolean {
  if (uid === undefined || uid === getUserId()) return false;
  return (
    connectionsQuery().find(
      (it) =>
        (status === undefined || it.status === status) &&
        (it.receiverUid === uid || it.initiatorUid === uid),
    ) !== undefined
  );
}

export async function invalidateConnections(): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.root(),
  });
}
