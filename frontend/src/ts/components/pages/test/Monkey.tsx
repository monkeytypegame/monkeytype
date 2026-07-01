import { Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { isTestActive } from "../../../states/test";

export function Monkey() {
  return (
    <Show when={getConfig.monkey && isTestActive()}>
      <div>monke</div>
    </Show>
  );
}
