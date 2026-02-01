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
    <div class="grid grid-cols-[1.25em_max-content_auto] items-center justify-items-start gap-2">
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

      <div class="text-sub flex items-center justify-center gap-2">
        <UserFlags
          user={props.user}
          iconsOnly={props.iconsOnly}
          isFriend={props.isFriend}
        />
        <UserBadge id={props.user.badgeId} />
      </div>
    </div>
  );
}

function UserFlags(
  props: {
    user: SupportsFlags;
  } & UserFlagOptions,
): JSXElement {
  const flags = (): UserFlag[] => getMatchingFlags(props);

  return (
    <For each={flags()}>
      {(flag) => (
        <Show when={props.iconsOnly ?? true} fallback={<Fa icon={flag.icon} />}>
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
    <Show when={badge !== undefined}>
      <div
        class="rounded-xs p-0.5 text-xs"
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
          <span class="hidden lg:inline"> {badge?.name}</span>
        </Show>
      </div>
    </Show>
  );
}
