import { UserProfile as UserProfileType } from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import { getUser } from "../../../collections/user";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  return (
    <Show when={getUser()} fallback="no user found">
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
