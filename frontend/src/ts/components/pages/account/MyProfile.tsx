import { JSXElement, Show } from "solid-js";

import { getActivePage } from "../../../states/core";
import { getSnapshot } from "../../../states/snapshot";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  const profile = () =>
    getActivePage() === "account" ? getSnapshot() : undefined;
  return (
    <Show when={profile()} fallback="no user found">
      {(p) => <UserProfile profile={p()} isAccountPage />}
    </Show>
  );
}
