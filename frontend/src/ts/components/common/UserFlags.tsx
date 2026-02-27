import { For, JSXElement, Show } from "solid-js";

import {
  getMatchingFlags,
  SupportsFlags,
  UserFlag,
  UserFlagOptions,
} from "../../controllers/user-flag-controller";
import { Fa } from "./Fa";
export function UserFlags(props: SupportsFlags & UserFlagOptions): JSXElement {
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
