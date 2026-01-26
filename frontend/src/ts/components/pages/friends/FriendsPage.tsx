import { JSXElement, Show } from "solid-js";

import { getActivePage } from "../../../signals/core";

import { FriendsList } from "./FriendsList";
export function FriendsPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "friends";
  return (
    <Show when={isOpen}>
      <div class="content-grid grid gap-8">
        <FriendsList />
      </div>
    </Show>
  );
}
