import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { FaSolidIcon } from "../../types/font-awesome";
import { Fa } from "./Fa";

//cache successful and missing avatars
const [avatar, setAvatar] = createStore<Record<string, boolean>>({});

export function DiscordAvatar(props: {
  discordId: string | undefined;
  discordAvatar: string | undefined;
  size?: number;
  missingIcon?: FaSolidIcon;
}): JSXElement {
  const cacheKey = (): string => `${props.discordId}/${props.discordAvatar}`;
  const [showSpinner, setShowSpinner] = createSignal(true);
  return (
    <div class="relative inline-flex h-[1em] w-[1em] shrink-0 items-center justify-center text-lg">
      <Show
        when={
          props.discordId !== undefined &&
          props.discordAvatar !== undefined &&
          avatar[cacheKey()] !== false
        }
        fallback={<Fa icon={props.missingIcon ?? "fa-user-circle"} />}
      >
        <>
          <Show when={showSpinner()}>
            <Fa icon={"fa-circle-notch"} spin={true} class="absolute inset-0" />
          </Show>
          <img
            src={`https://cdn.discordapp.com/avatars/${props.discordId}/${props.discordAvatar}.png?size=${props.size ?? 32}`}
            class="relative h-full w-full rounded-full object-cover"
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
