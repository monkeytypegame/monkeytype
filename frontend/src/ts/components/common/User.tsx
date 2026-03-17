import { User as UserType } from "@monkeytype/schemas/users";
import { AnimationParams } from "animejs";
import { createEffect, createSignal, JSXElement, on, Show } from "solid-js";

import {
  getMatchingFlags,
  SupportsFlags,
  UserFlagOptions,
} from "../../controllers/user-flag-controller";
import { cn } from "../../utils/cn";
import { Anime, AnimeConditional } from "./anime";
import { Button } from "./Button";
import { Conditional } from "./Conditional";
import { DiscordAvatar } from "./DiscordAvatar";
import { Fa } from "./Fa";
import { NotificationBubble } from "./NotificationBubble";
import { UserBadge } from "./UserBadge";
import { UserFlags } from "./UserFlags";

type Props = {
  class?: string;
  user: SupportsFlags &
    Pick<UserType, "uid" | "name" | "discordId" | "discordAvatar" | "xp"> & {
      badgeId?: number;
    };
  showAvatar?: boolean;
  avatarFallback?: "user" | "user-circle";
  avatarColor?: "text" | "sub";
  flagsColor?: "text" | "sub";
  hideNameOnSmallScreens?: boolean;
  linkToProfile?: boolean;
  level?: number;
  showSpinner?: boolean;
  showNotificationBubble?: boolean;
  fontClass?: "text-em-xs" | "text-em-sm" | "text-em-md" | "text-em-lg";
} & UserFlagOptions;

export function User(props: Props): JSXElement {
  const [flashAnimation, setFlashAnimation] = createSignal<
    AnimationParams | undefined
  >(undefined);
  const [isAnimating, setIsAnimating] = createSignal(false);
  let levelEl: HTMLElement | undefined;

  createEffect(
    on(
      () => props.level,
      () => {
        const rand = (Math.random() * 2 - 1) / 4;
        const rand2 = (Math.random() + 1) / 2;
        setFlashAnimation({
          scale: [1 + 0.5 * rand2, 1],
          backgroundColor: [
            "var(--themable-button-active)",
            "var(--themable-button-text)",
          ],
          rotate: [10 * rand, 0],
          duration: 2000,
          ease: "out(5)",
          onBegin: () => setIsAnimating(true),
          onComplete: () => {
            setIsAnimating(false);
            if (levelEl) {
              levelEl.style.backgroundColor = "";
            }
          },
        });
      },
      { defer: true },
    ),
  );

  return (
    <div
      class={cn(
        "grid grid-flow-col place-items-center gap-[0.5em]",
        props.class,
      )}
    >
      <Show when={props.showAvatar ?? true}>
        <div class="relative w-[1.25em]" data-ui-element="navAvatar">
          <NotificationBubble
            variant="atCorner"
            show={props.showNotificationBubble ?? false}
            class="z-2 m-0.5"
          />
          <div class="grid place-items-center">
            <AnimeConditional
              exitBeforeEnter
              if={props.showSpinner ?? false}
              then={<Fa icon={"fa-circle-notch"} spin={true} />}
              else={
                <DiscordAvatar
                  size={64}
                  discordId={props.user.discordId}
                  discordAvatar={props.user.discordAvatar}
                  fallbackIcon={props.avatarFallback ?? "user"}
                  class={cn(
                    props.avatarColor === "text" && "text-text",
                    props.avatarColor === "sub" && "text-sub",
                  )}
                />
              }
            />
          </div>
        </div>
      </Show>
      <div
        class={cn(props.fontClass, {
          "hidden sm:block": props.hideNameOnSmallScreens,
        })}
      >
        <Conditional
          if={props.linkToProfile ?? false}
          then={
            <Button
              variant="text"
              href={`/profile/${props.user.name}`}
              text={props.user.name}
              router-link
              class="px-0"
            />
          }
          else={props.user.name}
        />
      </div>

      <Show
        when={
          getMatchingFlags({ ...props.user, isFriend: props.isFriend }).length >
          0
        }
      >
        <div
          class={cn(
            "flex items-center justify-center gap-[0.5em]",
            cn(
              props.flagsColor === "text" && "text-text",
              props.flagsColor === "sub" && "text-sub",
            ),
          )}
        >
          <UserFlags
            {...props.user}
            isFriend={props.isFriend}
            iconsOnly={props.iconsOnly}
          />
        </div>
      </Show>
      <Show when={props.user.badgeId !== undefined}>
        <UserBadge id={props.user.badgeId} />
      </Show>
      <Show when={props.level !== undefined}>
        <Anime
          ref={(el) => (levelEl = el)}
          animation={flashAnimation()}
          class={cn(
            "bg-(--themable-button-text) text-(--bg-color)",
            "rounded-half px-[0.5em] py-[0.1em] text-[0.7em]",
            { "transition-colors duration-125": !isAnimating() },
          )}
          data-ui-element="userLevel"
        >
          {props.level}
        </Anime>
      </Show>
    </div>
  );
}
