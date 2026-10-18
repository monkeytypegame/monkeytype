import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import { getUserProfile } from "../../../queries/profile";
import { getSelectedProfileName } from "../../../states/core";
import AsyncContent from "../../common/AsyncContent";
import { Fa } from "../../common/Fa";
import { UserProfile } from "./UserProfile";

export function ProfilePage(): JSXElement {
  const profileQuery = useQuery(() => ({
    ...getUserProfile(getSelectedProfileName() as string),
    enabled: getSelectedProfileName() !== undefined,
  }));

  return (
    <div class="flex h-full items-center justify-center text-lg">
      <AsyncContent queries={{ profileQuery }} ignoreError={true}>
        {({ profileQueryData }) => <UserProfile profile={profileQueryData()} />}
      </AsyncContent>
      <Show when={profileQuery.isError}>
        <div class="flex items-baseline gap-2 text-error">
          <Fa icon="fa-times" />
          <span>User {getSelectedProfileName()} not found</span>
        </div>
      </Show>
    </div>
  );
}
