import { Show } from "solid-js";

import { getActivePage } from "../../../states/core";
import { FriendsList } from "./FriendsList";
import { PendingRequests } from "./PendingRequests";

export function FriendsPage() {
  const isOpen = (): boolean => getActivePage() === "friends";

  return (
    <Show when={isOpen()}>
      <div class="content-grid grid gap-8">
        <PendingRequests />
        <FriendsList />
      </div>
    </Show>
  );
}
