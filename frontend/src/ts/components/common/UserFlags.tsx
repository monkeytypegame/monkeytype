import { For, JSXElement, Show } from "solid-js";

import {
  getMatchingFlags,
  SupportsFlags,
  UserFlag,
  UserFlagOptions,
} from "../../constants/user-flags";
import { Balloon } from "./Balloon";
import { Fa } from "./Fa";
export function UserFlags(
  props: SupportsFlags &
    UserFlagOptions & {
      class?: string;
    },
): JSXElement {
  const flags = (): UserFlag[] => getMatchingFlags(props);

  return (
    <For each={flags()}>
      {(flag) => (
        <Show
          when={!props.iconsOnly}
          fallback={<Fa icon={flag.icon} class={props.class} />}
        >
          <Balloon
            text={flag.description}
            position="right"
            class={props.class}
            style={{
              background: flag.background ?? "inherit",
              color: flag.color ?? "inherit",
            }}
          >
            {<Fa icon={flag.icon} />}
          </Balloon>
        </Show>
      )}
    </For>
  );
}
