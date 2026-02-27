import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import { PageName } from "../../../pages/page";
import { getUserProfile } from "../../../queries/profile";
import { getActivePage, getSelectedProfileName } from "../../../signals/core";
import AsyncContent from "../../common/AsyncContent";
import { Fa } from "../../common/Fa";
import { UserProfile } from "./UserProfile";

const pageName: PageName = "profile";
export function ProfilePage(): JSXElement {
  const isOpen = () => getActivePage() === pageName;

  const profileQuery = useQuery(() => ({
    ...getUserProfile(getSelectedProfileName() as string),
    enabled: isOpen() && getSelectedProfileName() !== undefined,
  }));

  return (
    <div class="flex h-full items-center justify-center text-lg">
      <AsyncContent query={profileQuery} ignoreError={true}>
        {(profile) => <UserProfile profile={profile} />}
      </AsyncContent>
      <Show when={profileQuery.isError}>
        <Fa icon="fa-times" />
        &nbsp;User {getSelectedProfileName()} not found
      </Show>
    </div>
  );
}
