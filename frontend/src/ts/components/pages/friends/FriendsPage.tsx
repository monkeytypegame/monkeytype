import { ConnectionStatus } from "@monkeytype/schemas/connections";
import { Friend } from "@monkeytype/schemas/users";
import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import Ape from "../../../ape";
import { queryClient } from "../../../collections/client";
import { connectionsCollection } from "../../../collections/connections";
import * as Notifications from "../../../elements/notifications";
import { getActivePage, getUserId } from "../../../signals/core";
import { addToGlobal } from "../../../utils/misc";

import { FriendsList } from "./FriendsList";
import { PendingConnectionsList } from "./PendingConnectionsList";

const friendsDataName = "friendsList";

export function FriendsPage(): JSXElement {
  const friendsData = useQuery(() => {
    const uid = getUserId();
    return {
      queryClient: queryClient,
      queryKey: [friendsDataName],
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

  const addFriend = async (receiverName: string): Promise<void> => {
    setTimeout(async () => {
      const response = await Ape.connections.create({ body: { receiverName } });

      if (response.status === 200) {
        Notifications.add(`Request sent to ${receiverName}`, 1);
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
    }, 0);
  };

  const removeFriend = async (connectionId: string): Promise<void> => {
    void connectionsCollection
      .delete(connectionId)
      .isPersisted.promise.then(() => {
        void friendsData.refetch();
      });

    //optimistic update
    const currentFriends = queryClient.getQueryData([
      friendsDataName,
    ]) as Friend[];
    if (currentFriends !== undefined) {
      const updatedFriends = currentFriends.filter(
        (it) => it.connectionId !== connectionId,
      );
      queryClient.setQueryData([friendsDataName], () => updatedFriends);
    }
  };

  const updateConnection = async (
    connectionId: string,
    status: ConnectionStatus | "rejected",
  ): Promise<void> => {
    const tx =
      status === "rejected"
        ? connectionsCollection.delete(connectionId)
        : connectionsCollection.update(connectionId, (draft) => {
            draft.status = status;
          });

    void tx.isPersisted.promise.then(() => {
      if (status === "accepted") {
        void friendsData.refetch();
      }

      if (status === "blocked") {
        Notifications.add(`User has been blocked`, 0);
      }
      if (status === "accepted") {
        Notifications.add(`Request accepted`, 1);
      }
      if (status === "rejected") {
        Notifications.add(`Request rejected`, 0);
      }
    });
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
