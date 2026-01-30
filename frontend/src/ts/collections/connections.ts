import {
  and,
  createCollection,
  eq,
  InitialQueryBuilder,
  not,
} from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./client";

import Ape from "../ape";

import { Connection } from "@monkeytype/schemas/connections";
import { useLiveQuery } from "@tanstack/solid-db";
import * as Notifications from "../elements/notifications";
import { createEffectOn } from "../hooks/effects";
import { getActivePage, getUserId, isLoggedIn } from "../signals/core";

createEffectOn(getActivePage, (page) => {
  //refresh connections when entering the friends page
  if (page === "friends") {
    console.log("#### trigger refresh on page friends");
    invalidateQuery();
  }
});

const connectionsCollectionName = "connections";
export const connectionsCollection = createCollection(
  queryCollectionOptions({
    syncMode: "on-demand",
    queryClient,
    queryKey: [connectionsCollectionName],
    staleTime: 1000 * 5, //5 seconds

    getKey: (item) => item._id,
    queryFn: async () => {
      if (!isLoggedIn()) return [];
      console.log("### fetch connections");
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

export const pendingConnectionsQuery = useLiveQuery(() => ({
  id: "pendingConnections",
  startSync: false,
  query: (q: InitialQueryBuilder) => {
    console.log("### pending");
    return q
      .from({ connections: connectionsCollection })
      .where(({ connections }) =>
        and(
          eq(connections.status, "pending"),
          not(eq(connections.initiatorUid, getUserId())),
        ),
      );
  },
}));

export function isFriend(uid: string): boolean {
  return (
    findConnectionByUid({ receiverUid: uid, initiatorUid: uid })?.status ===
    "accepted"
  );
}

export function findConnectionByUid({
  initiatorUid,
  receiverUid,
}: {
  initiatorUid?: string;
  receiverUid?: string;
}): Connection | undefined {
  return connectionsCollection.toArray.find(
    (it) => it.initiatorUid === initiatorUid || it.receiverUid === receiverUid,
  );
}

export async function addConnection(receiverName: string): Promise<void> {
  const response = await Ape.connections.create({ body: { receiverName } });

  if (response.status === 200) {
    Notifications.add(`Request sent to ${receiverName}`, 1);
    invalidateQuery();
  } else {
    const result = response.body.message;
    let status = -1;
    let message = "Unknown error";

    if (result.includes("already exists")) {
      status = 0;
      message = `You are already friends with ${receiverName}`;
    } else if (result.includes("request already sent")) {
      status = 0;
      message = `You have already sent a friend request to ${receiverName}`;
    } else if (result.includes("blocked by initiator")) {
      status = 0;
      message = `You have blocked ${receiverName}`;
    } else if (result.includes("blocked by receiver")) {
      status = 0;
      message = `${receiverName} has blocked you`;
    }

    Notifications.add(message, status);
  }
}

function invalidateQuery(): void {
  // void queryClient.invalidateQueries({ queryKey: [connectionsCollectionName] });
}
