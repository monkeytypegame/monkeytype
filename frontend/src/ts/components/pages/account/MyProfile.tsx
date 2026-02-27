import { UserProfile as UserProfileType } from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import { getActivePage } from "../../../signals/core";
import { getSnapshot } from "../../../stores/snapshot";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  const isOpen = () => getActivePage() === "account";
  return (
    <Show when={isOpen()} fallback="no user found">
      <UserProfile profile={getSnapshot() as UserProfileType} isAccountPage />
    </Show>
  );
}
