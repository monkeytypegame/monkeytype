import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { cn } from "../../utils/cn";
import { Fa, FaProps } from "./Fa";
import { LoadingCircle } from "./LoadingCircle";

//cache successful and missing avatars
const [avatar, setAvatar] = createStore<Record<string, boolean>>({});

export function DiscordAvatar(props: {
  discordId: string | undefined;
  discordAvatar: string | undefined;
  size?: number;
  class?: string;
  fallbackIcon?: FaProps;
}): JSXElement {
  const cacheKey = (): string => `${props.discordId}/${props.discordAvatar}`;
  const [showSpinner, setShowSpinner] = createSignal(true);
  return (
    <div
      class={cn("grid h-[1.25em] w-[1.25em] place-items-center", props.class)}
    >
      <Show
        when={
          props.discordId !== undefined &&
          props.discordAvatar !== undefined &&
          avatar[cacheKey()] !== false
        }
        fallback={
          <Fa {...(props.fallbackIcon ?? { icon: "fa-user-circle" })} />
        }
      >
        <>
          <Show when={showSpinner()}>
            <LoadingCircle
              mode="svg"
              class="col-start-1 row-start-1 h-full w-full fill-sub"
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
      </Show>
    </div>
  );
}
