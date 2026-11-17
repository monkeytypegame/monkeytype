import { JSXElement, Show } from "solid-js";

import { getUserData } from "../../../queries/user";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  return (
    <Show when={getUserData()} fallback="no user found">
      {(p) => <UserProfile profile={p()} isAccountPage />}
    </Show>
  );
}
