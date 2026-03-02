import { User as UserType } from "@monkeytype/schemas/users";
import { AnimationParams } from "animejs";
import {
  createEffect,
  createSignal,
  JSXElement,
  on,
  onMount,
  Show,
} from "solid-js";

import {
  SupportsFlags,
  UserFlagOptions,
} from "../../controllers/user-flag-controller";
import {
  getAnimatedLevel,
  setAnimatedLevel,
} from "../../signals/animated-level";
import { getTheme } from "../../signals/theme";
import { cn } from "../../utils/cn";
import { getLevelFromTotalXp } from "../../utils/levels";
import { Anime, AnimeConditional } from "./anime";
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
  const theme = getTheme();

  onMount(() => {
    setAnimatedLevel(getLevelFromTotalXp(props.user.xp ?? 0));
  });

  const [flashAnimation, setFlashAnimation] = createSignal<
    AnimationParams | undefined
  >(undefined);
  const [isAnimating, setIsAnimating] = createSignal(false);
  let levelEl: HTMLElement | undefined;

  createEffect(
    on(
      getAnimatedLevel,
      () => {
        const rand = (Math.random() * 2 - 1) / 4;
        const rand2 = (Math.random() + 1) / 2;
        setFlashAnimation({
          scale: [1 + 0.5 * rand2, 1],
          backgroundColor: [theme.main, theme.sub],
          rotate: [10 * rand, 0],
          duration: 2000,
          ease: "out(5)",
          onBegin: () => setIsAnimating(true),
          onComplete: () => {
            setIsAnimating(false);
            if (levelEl) levelEl.style.backgroundColor = "";
          },
        });
      },
      { defer: true },
    ),
  );

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
        <Anime
          ref={(el) => (levelEl = el)}
          animation={flashAnimation()}
          class={cn(
            "level rounded-half bg-(--unhoveredcolor) px-[0.5em] py-[0.1em] text-[0.7em] text-bg [--unhoveredcolor:var(--color-sub)]",
            { "transition-colors duration-125": !isAnimating() },
          )}
        >
          {getAnimatedLevel()}
        </Anime>
      </Show>
    </div>
  );
}
