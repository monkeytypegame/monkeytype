import { JSXElement, Show } from "solid-js";

import { get } from "../../../ape/server-configuration";
import { signOut } from "../../../auth";
import { getSnapshot, MiniSnapshot } from "../../../stores/snapshot";
import { AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";

type Props = {
  show: boolean;
  showFriendsNotificationBubble?: boolean;
};

export function AccountMenu(props: Props): JSXElement {
  const buttonClass =
    "w-full justify-start rounded-none px-3 py-2 whitespace-nowrap gap-2";

  return (
    <AnimeShow
      when={props.show}
      class="absolute right-0 z-1000 w-auto overflow-hidden rounded bg-sub-alt text-xs ring-6 ring-bg"
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
      <Show when={get()?.connections.enabled}>
        <Button
          text="Friends"
          class={buttonClass}
          fa={{
            icon: "fa-user-friends",
            fixedWidth: true,
          }}
          href="/friends"
          router-link
        >
          <Show when={props.showFriendsNotificationBubble}>
            <div class="absolute right-2 h-1.5 w-1.5 rounded-full bg-main ring-3 ring-sub-alt"></div>
          </Show>
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
        text="Signout"
        class={buttonClass}
        fa={{
          icon: "fa-sign-out-alt",
          fixedWidth: true,
        }}
        onClick={() => {
          signOut();
        }}
      />
    </AnimeShow>
  );
}
