import { JSXElement, Show } from "solid-js";

import { get as getServerConfiguration } from "../../../ape/server-configuration";
import { signOut } from "../../../auth";
import { getSnapshot, MiniSnapshot } from "../../../stores/snapshot";
import { AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";

type Props = {
  show: boolean;
  showFriendsNotificationBubble?: boolean;
};

export function AccountMenu(props: Props): JSXElement {
  const buttonClass =
    "w-full justify-start rounded-none px-3 py-2 whitespace-nowrap gap-2";

  return (
    <AnimeShow when={props.show} class="absolute right-0 z-1000 w-auto text-xs">
      <div class="h-2"></div>
      <div
        class="overflow-hidden rounded bg-sub-alt ring-6 ring-bg"
        data-ui-element="accountMenu"
      >
        <Button
          text="User stats"
          class={buttonClass}
          fa={{
            icon: "fa-chart-line",
            fixedWidth: true,
          }}
          href="/account"
          router-link
        />
        <Show when={getServerConfiguration()?.connections.enabled}>
          <Button
            text="Friends"
            class={buttonClass + " relative"}
            fa={{
              icon: "fa-user-friends",
              fixedWidth: true,
            }}
            href="/friends"
            router-link
          >
            <NotificationBubble
              show={props.showFriendsNotificationBubble ?? false}
              variant="center"
              class="right-2 left-auto"
            />
          </Button>
        </Show>
        <Button
          text="Public profile"
          class={buttonClass}
          fa={{
            icon: "fa-globe-americas",
            fixedWidth: true,
          }}
          href={"/profile/" + (getSnapshot() as MiniSnapshot).name}
          router-link
        />
        <Button
          text="Account settings"
          class={buttonClass}
          fa={{
            icon: "fa-cog",
            fixedWidth: true,
          }}
          href="/account-settings"
          router-link
        />
        <Button
          text="Sign out"
          class={buttonClass}
          fa={{
            icon: "fa-sign-out-alt",
            fixedWidth: true,
          }}
          onClick={() => {
            signOut();
          }}
        />
      </div>
    </AnimeShow>
  );
}
