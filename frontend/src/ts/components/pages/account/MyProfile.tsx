import { UserProfile as UserProfileType } from "@monkeytype/schemas/users";
import { createSignal, JSXElement, Show } from "solid-js";

import { getSnapshot } from "../../../db";
import { createEffectOn } from "../../../hooks/effects";
import { getUserId } from "../../../signals/core";
import { UserProfile } from "../profile/UserProfile";

export function MyProfile(): JSXElement {
  const [myProfile, setMyProfile] = createSignal<UserProfileType | undefined>(
    undefined,
  );

  createEffectOn(getUserId, () => {
    setMyProfile(getSnapshot() as UserProfileType);
  });

  return (
    <Show when={myProfile() !== undefined} fallback="no user found">
      <UserProfile profile={myProfile() as UserProfileType} isAccountPage />
    </Show>
  );
}
