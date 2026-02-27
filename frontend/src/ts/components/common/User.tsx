import { User as UserType } from "@monkeytype/schemas/users";
import { For, JSXElement, Show } from "solid-js";

import {
  badges,
  UserBadge as UserBadgeType,
} from "../../controllers/badge-controller";
import {
  getMatchingFlags,
  SupportsFlags,
  UserFlag,
  UserFlagOptions,
} from "../../controllers/user-flag-controller";
import { Button } from "./Button";
import { DiscordAvatar } from "./DiscordAvatar";
import { Fa } from "./Fa";

export function User(
  props: {
    user: SupportsFlags &
      Pick<UserType, "uid" | "name" | "discordId" | "discordAvatar"> & {
        badgeId?: number;
      };
    showAvatar?: boolean;
  } & UserFlagOptions,
): JSXElement {
  return (
    <div class="inline-flex items-center text-sm leading-none">
      <Show when={props.showAvatar ?? true}>
        <DiscordAvatar
          discordId={props.user.discordId}
          discordAvatar={props.user.discordAvatar}
        />
      </Show>
      <Button
        type="text"
        href={`/profile/${props.user.uid}?isUid`}
        text={props.user.name}
        router-link
      />
      <div class="flex items-center justify-center gap-2 text-sub">
        <UserFlags
          {...props.user}
          isFriend={props.isFriend}
          iconsOnly={props.iconsOnly}
        />
        <UserBadge id={props.user.badgeId} />
      </div>
    </div>
  );
}

function UserFlags(props: SupportsFlags & UserFlagOptions): JSXElement {
  const flags = (): UserFlag[] => getMatchingFlags(props);

  return (
    <For each={flags()}>
      {(flag) => (
        <Show when={!props.iconsOnly} fallback={<Fa icon={flag.icon} />}>
          <div
            aria-label={flag.description}
            data-balloon-pos="right"
            style={{
              background: flag.background ?? "inherit",
              color: flag.color ?? "inherit",
            }}
          >
            {<Fa icon={flag.icon} />}
          </div>
        </Show>
      )}
    </For>
  );
}

function UserBadge(props: { id?: number }): JSXElement {
  const badge = (): UserBadgeType | undefined =>
    props.id !== undefined ? badges[props.id] : undefined;
  return (
    <Show when={badge() !== undefined}>
      <div
        class="rounded-md p-[0.5em] text-[0.75em]"
        aria-label={badge()?.description}
        data-balloon-pos="right"
        style={{
          background: badge()?.background ?? "inherit",
          color: badge()?.color ?? "inherit",
          ...badge()?.customStyle,
        }}
      >
        <Show when={badge()?.icon}>
          <Fa icon={badge()?.icon ?? "fa-question"} fixedWidth={true} />
          <span class="hidden md:inline"> {badge()?.name}</span>
        </Show>
      </div>
    </Show>
  );
}
