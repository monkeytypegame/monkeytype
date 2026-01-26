import { JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { FaSolidIcon } from "../../types/font-awesome";
import { addToGlobal } from "../../utils/misc";

import { Conditional } from "./Conditional";
import { Fa } from "./Fa";

const [avatar, setAvatar] = createStore<Record<string, boolean>>();

export function DiscordAvatar(props: {
  discordId: string | undefined;
  discordAvatar: string | undefined;
  size?: number;
  missingIcon?: FaSolidIcon;
}): JSXElement {
  return (
    <div class="relative inline-block h-[1em] w-[1em]">
      <Conditional
        if={
          props.discordId !== undefined &&
          props.discordAvatar !== undefined &&
          avatar[`${props.discordId}/${props.discordAvatar}`] !== false
        }
        then={
          <>
            <Show
              when={
                avatar[`${props.discordId}/${props.discordAvatar}`] ===
                undefined
              }
            >
              <Fa
                icon={"fa-circle-notch"}
                spin={true}
                class="absolute z-0 h-[1em] w-[1em]"
              />
            </Show>
            <img
              src={`https://cdn.discordapp.com/avatars/${props.discordId}/${props.discordAvatar}.png?size=${props.size ?? 32}`}
              class="absolute z-10 h-[1em] w-[1em] rounded-full object-cover"
              onLoad={() => {
                setAvatar(`${props.discordId}/${props.discordAvatar}`, true);
              }}
              onError={() => {
                setAvatar(`${props.discordId}/${props.discordAvatar}`, false);
              }}
            />
          </>
        }
        else={<Fa icon={props.missingIcon ?? "fa-user-circle"} />}
      />
    </div>
  );
}

addToGlobal({ avatar, setAvatar });
