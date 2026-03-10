import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { cn } from "../../utils/cn";
import { Conditional } from "./Conditional";
import { LoadingCircle } from "./LoadingCircle";

//cache successful and missing avatars
const [avatar, setAvatar] = createStore<Record<string, boolean>>({});

export function DiscordAvatar(props: {
  discordId: string | undefined;
  discordAvatar: string | undefined;
  size?: number;
  class?: string;
  fallbackIcon?: "user-circle" | "user";
}): JSXElement {
  const cacheKey = (): string => `${props.discordId}/${props.discordAvatar}`;
  const [showSpinner, setShowSpinner] = createSignal(true);

  const showDiscordAvatar = () =>
    props.discordId !== undefined &&
    props.discordAvatar !== undefined &&
    avatar[cacheKey()] !== false;

  const fallback = () => {
    if (
      props.fallbackIcon === "user-circle" ||
      props.fallbackIcon === undefined
    ) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 502 512"
          class="fill-current transition-colors duration-125"
        >
          {/* <!--!Font Awesome Free v5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--> */}
          <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path>
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          class="fill-current p-[0.2em] transition-colors duration-125"
        >
          {/* <!--!Font Awesome Free v5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--> */}
          <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
        </svg>
      );
    }
  };

  return (
    <div
      class={cn(
        "grid aspect-square h-[1.25em] w-[1.25em] place-items-stretch",
        props.class,
      )}
    >
      <Conditional
        if={showDiscordAvatar()}
        then={
          <>
            <Show when={showSpinner()}>
              <LoadingCircle
                color="sub"
                mode="svg"
                class="col-start-1 row-start-1 h-full w-full fill-current"
              />
            </Show>
            <img
              src={`https://cdn.discordapp.com/avatars/${props.discordId}/${props.discordAvatar}.png?size=${props.size ?? 32}`}
              class="col-start-1 row-start-1 rounded-full"
              onLoad={() => {
                setAvatar(cacheKey(), true);
                setShowSpinner(false);
              }}
              onError={() => {
                setAvatar(cacheKey(), false);
                setShowSpinner(false);
              }}
            />
          </>
        }
        else={fallback()}
      />
    </div>
  );
}
