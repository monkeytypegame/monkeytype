import { JSXElement, Show } from "solid-js";

import { get as getServerConfiguration } from "../../../ape/server-configuration";
import { signOut } from "../../../auth";
import { getUserData } from "../../../states/user";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";

type Props = {
  /** classes for the menu's outer element, eg. when to show it */
  class?: string;
  showFriendsNotificationBubble?: boolean;
};

export function AccountMenu(props: Props): JSXElement {
  const buttonClass =
    "w-full justify-start px-3 py-2 whitespace-nowrap gap-2 bg-transparent";

  return (
    <div
      class={cn(
        "pointer-events-none absolute right-0 z-1000 w-auto text-xs opacity-0 transition-opacity duration-125",
        props.class,
      )}
      data-ui-element="accountMenu"
    >
      <div class="h-3"></div>
      <div
        class="grid grid-flow-row rounded bg-sub-alt ring-6 ring-bg"
        data-ui-element="accountMenu"
      >
        <Button
          text="User stats"
          class={buttonClass}
          fa={{
            icon: "fa-chart-line",
            fixedWidth: true,
          }}
          to="/account"
        />
        <Show when={getServerConfiguration()?.connections.enabled}>
          <Button
            text="Friends"
            class={`${buttonClass} relative`}
            fa={{
              icon: "fa-user-friends",
              fixedWidth: true,
            }}
            to="/friends"
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
          to="/profile/$uidOrName"
          params={{ uidOrName: getUserData()?.name ?? "" }}
        />
        <Button
          text="Account settings"
          class={buttonClass}
          fa={{
            icon: "fa-cog",
            fixedWidth: true,
          }}
          to="/account-settings"
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
    </div>
  );
}
