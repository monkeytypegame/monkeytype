import { ConnectionStatus } from "@monkeytype/schemas/connections";
import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import Ape from "../../../ape";
import { queryClient } from "../../../collections/client";
import { connectionsCollection } from "../../../collections/connections";
import { getActivePage, getUserId } from "../../../signals/core";
import { addToGlobal } from "../../../utils/misc";

import { FriendsList } from "./FriendsList";
import { PendingConnectionsList } from "./PendingConnectionsList";
export function FriendsPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "friends";

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
      //TODO add to connections
      return true;
    }
  };

  const removeFriend = async (connectionId: string): Promise<true | string> => {
    await connectionsCollection.delete(connectionId).isPersisted.promise;

    void friendsData.refetch();
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
    <Show when={isOpen}>
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
