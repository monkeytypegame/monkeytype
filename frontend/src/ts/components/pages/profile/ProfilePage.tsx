import { useQuery } from "@tanstack/solid-query";
import { createSignal, JSXElement, Show } from "solid-js";

import Page, { PageName } from "../../../pages/page";
import { getUserProfile } from "../../../queries/profile";
import { getActivePage } from "../../../signals/core";
import { onDOMReady, qsr } from "../../../utils/dom";
import * as Skeleton from "../../../utils/skeleton";
import AsyncContent from "../../common/AsyncContent";
import { Fa } from "../../common/Fa";
import { UserProfile } from "./UserProfile";

const [currentName, setCurrentName] = createSignal<string | undefined>(
  undefined,
);

const pageName: PageName = "profile";
export function ProfilePage(): JSXElement {
  const isOpen = () => getActivePage() === pageName;

  const profileQuery = useQuery(() => ({
    ...getUserProfile(currentName() as string),
    enabled: isOpen() && currentName() !== undefined,
  }));

  return (
    <div class="flex h-full items-center justify-center text-lg text-error">
      <AsyncContent query={profileQuery} ignoreError={true}>
        {(profile) => <UserProfile profile={profile} />}
      </AsyncContent>
      <Show when={profileQuery.isError}>
        <Fa icon="fa-times" />
        &nbsp;User {currentName()} not found
      </Show>
    </div>
  );
}

export const page = new Page({
  id: "profile",
  element: qsr(".page.pageProfile"),
  path: "/profile",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageProfile");
  },
  beforeShow: async (options): Promise<void> => {
    Skeleton.append("pageProfile", "main");
    const userName = options.params?.["uidOrName"];
    setCurrentName(userName);
  },
});

onDOMReady(() => {
  Skeleton.save("pageProfile");
});
