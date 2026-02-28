import { User as UserType } from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import {
  SupportsFlags,
  UserFlagOptions,
} from "../../controllers/user-flag-controller";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { DiscordAvatar } from "./DiscordAvatar";
import { UserBadge } from "./UserBadge";
import { UserFlags } from "./UserFlags";

export function User(
  props: {
    class?: string;
    user: SupportsFlags &
      Pick<UserType, "uid" | "name" | "discordId" | "discordAvatar"> & {
        badgeId?: number;
      };
    showAvatar?: boolean;
  } & UserFlagOptions,
): JSXElement {
  return (
    <div
      class={cn("inline-flex items-center text-sm leading-none", props.class)}
    >
      <Show when={props.showAvatar ?? true}>
        <DiscordAvatar
          discordId={props.user.discordId}
          discordAvatar={props.user.discordAvatar}
        />
      </Show>
      <Button
        type="text"
        href={`/profile/${props.user.name}`}
        text={props.user.name}
        router-link
        class="text-text hover:text-main"
      />
      <div class="flex items-center justify-center gap-2 text-sub">
        <UserFlags
          {...props.user}
          isFriend={props.isFriend}
          iconsOnly={props.iconsOnly}
        />
        <UserBadge id={props.user.badgeId} class="text-[0.7em]" />
      </div>
    </div>
  );
}
