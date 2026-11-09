import { UserProfile as UserProfileType } from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import { getUserData } from "../../../states/user";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  return (
    <Show when={getUserData()} fallback="no user found">
      {/* UserProfile only reads the profile */}
      {(p) => (
        <UserProfile
          profile={p() as unknown as UserProfileType}
          isAccountPage
        />
      )}
    </Show>
  );
}
