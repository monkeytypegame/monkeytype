import { User as UserType } from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import {
  SupportsFlags,
  UserFlagOptions,
} from "../../controllers/user-flag-controller";
import { cn } from "../../utils/cn";
import { getLevelFromTotalXp } from "../../utils/levels";
import { AnimeConditional } from "./anime";
import { Button } from "./Button";
import { Conditional } from "./Conditional";
import { DiscordAvatar } from "./DiscordAvatar";
import { Fa } from "./Fa";
import { UserBadge } from "./UserBadge";
import { UserFlags } from "./UserFlags";

type Props = {
  user: SupportsFlags &
    Pick<UserType, "uid" | "name" | "discordId" | "discordAvatar" | "xp"> & {
      badgeId?: number;
    };
  showAvatar?: boolean;
  linkToProfile?: boolean;
  showLevel?: boolean;
  showSpinner?: boolean;
  class?: string;
  hideNameOnSmallScreens?: boolean;
} & UserFlagOptions;

export function User(props: Props): JSXElement {
  return (
    <div class={cn("grid grid-flow-col place-items-center gap-2", props.class)}>
      <Show when={props.showAvatar ?? true}>
        <div class="w-[1.25em]">
          <AnimeConditional
            exitBeforeEnter
            if={props.showSpinner ?? false}
            then={<Fa icon={"fa-circle-notch"} spin={true} />}
            else={
              <DiscordAvatar
                size={64}
                discordId={props.user.discordId}
                discordAvatar={props.user.discordAvatar}
                fallbackIcon="user"
              />
            }
          />
        </div>
      </Show>
      <div
        class={cn("text-xs transition-colors duration-125", {
          "hidden sm:block": props.hideNameOnSmallScreens,
        })}
      >
        <Conditional
          if={props.linkToProfile ?? false}
          then={
            <Button
              type="text"
              href={`/profile/${props.user.name}`}
              text={props.user.name}
              router-link
            />
          }
          else={props.user.name}
        />
      </div>

      <div class="flex items-center justify-center gap-2">
        <UserFlags
          class="transition-colors duration-125"
          {...props.user}
          isFriend={props.isFriend}
          iconsOnly={props.iconsOnly}
        />
        <UserBadge id={props.user.badgeId} />
      </div>
      <Show when={props.showLevel ?? false}>
        <div class="level rounded-half bg-sub px-[0.5em] py-[0.1em] text-[0.7em] text-bg transition-colors duration-125">
          {getLevelFromTotalXp(props.user.xp ?? 0)}
        </div>
      </Show>
    </div>
  );
}
