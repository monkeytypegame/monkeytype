import { ConnectionStatus } from "@monkeytype/schemas/connections";
import { Friend } from "@monkeytype/schemas/users";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import Ape from "../../../ape";
import { queryClient } from "../../../collections/client";
import { connectionsCollection } from "../../../collections/connections";
import { createEffectOn } from "../../../hooks/effects";
import { getActivePage, getUserId } from "../../../signals/core";
import { addToGlobal } from "../../../utils/misc";

import { FriendsList } from "./FriendsList";
import { PendingConnectionsList } from "./PendingConnectionsList";
export function FriendsPage(): JSXElement {
  const friendsCollection = createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: ["friendsList", getUserId()],
      getKey: (item) => item.uid,
      queryFn: async () => {
        if (getUserId() === null) return [];
        const response = await Ape.users.getFriends();
        if (response.status !== 200) {
          throw new Error(response.body.message);
        }
        return response.body.data;
      },
    }),
  );
  addToGlobal({ fc: friendsCollection });

  const friendsData = useQuery(() => {
    const uid = getUserId();
    return {
      queryClient: queryClient,
      queryKey: ["friendsList", uid], //add current user id to the key to avoid mixing data
      queryFn: async () => {
        const response = await Ape.users.getFriends();
        if (response.status !== 200) {
          throw new Error(response.body.message);
        }
        return response.body.data;
      },
      //only load if we have a user and are on the friends page
      enabled: uid !== null && getActivePage() === "friends",
    };
  });
  addToGlobal({ fd: friendsData });

  const addFriend = async (receiverName: string): Promise<true | string> => {
    const result = await Ape.connections.create({ body: { receiverName } });

    if (result.status !== 200) {
      return `Friend request failed: ${result.body.message}`;
    } else {
      return true;
    }
  };

  const removeFriend = async (connectionId: string): Promise<true | string> => {
    const tx = connectionsCollection.delete(connectionId);

    //optimistic update not working. remove the friend from the friendsList
    const currentFriends = queryClient.getQueryData(["friendsList"]) as
      | Friend[]
      | undefined;
    if (currentFriends) {
      const updatedFriends = currentFriends.filter(
        (it) => it.connectionId !== connectionId,
      );
      queryClient.setQueryData(["friendsList"], updatedFriends);
    }

    setTimeout(async () => {
      await tx.isPersisted.promise;
      void friendsData.refetch();
    }, 500);
    return true;
  };

  const updateConnection = async (
    connectionId: string,
    status: ConnectionStatus | "rejected",
  ): Promise<void> => {
    if (status === "rejected") {
      await connectionsCollection.delete(connectionId).isPersisted.promise;
    } else {
      await connectionsCollection.update(connectionId, (draft) => {
        draft.status = status;
      }).isPersisted.promise;
    }

    if (status === "accepted") {
      void friendsData.refetch();
    }
  };

  return (
    <Show when={true}>
      <div class="content-grid grid gap-8">
        <section>
          <PendingConnectionsList onUpdate={updateConnection} />
        </section>
        <section>
          <FriendsList
            data={friendsData}
            onAdd={addFriend}
            onDelete={removeFriend}
          />
        </section>
      </div>
    </Show>
  );
}
