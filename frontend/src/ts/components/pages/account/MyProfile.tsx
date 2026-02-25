import { UserProfile as UserProfileType } from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import { getSnapshot } from "../../../stores/snapshot";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  return (
    <Show when={getSnapshot()} fallback="no user found">
      <UserProfile profile={getSnapshot() as UserProfileType} isAccountPage />
    </Show>
  );
}
