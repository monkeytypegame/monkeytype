import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { Fa, FaProps } from "./Fa";

//cache successful and missing avatars
const [avatar, setAvatar] = createStore<Record<string, boolean>>({});

export function DiscordAvatar(props: {
  discordId: string | undefined;
  discordAvatar: string | undefined;
  size?: number;
  fallbackIcon?: FaProps;
}): JSXElement {
  const cacheKey = (): string => `${props.discordId}/${props.discordAvatar}`;
  const [showSpinner, setShowSpinner] = createSignal(true);
  return (
    <div class="grid h-[1.25em] w-[1.25em] items-center justify-center">
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
            <Fa icon={"fa-circle-notch"} spin={true} class="absolute" />
          </Show>
          <img
            src={`https://cdn.discordapp.com/avatars/${props.discordId}/${props.discordAvatar}.png?size=${props.size ?? 32}`}
            class="rounded-full"
            onLoad={() => {
              setAvatar(cacheKey(), true);
              setShowSpinner(false);
            }}
            onError={() => {
              setAvatar(cacheKey(), false);
            }}
          />
        </>
      </Show>
    </div>
  );
}
