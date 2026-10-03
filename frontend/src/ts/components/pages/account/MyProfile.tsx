import { JSXElement, Show } from "solid-js";

import { getSnapshot } from "../../../states/snapshot";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  return (
    <Show when={getSnapshot()} fallback="no user found">
      {(p) => <UserProfile profile={p()} isAccountPage />}
    </Show>
  );
}
