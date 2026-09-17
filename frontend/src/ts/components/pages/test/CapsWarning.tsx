import { Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { isCapsLockOn } from "../../../states/modifiers";
import { Fa } from "../../common/Fa";

export function CapsWarning() {
  return (
    <Show when={getConfig.capsLockWarning && isCapsLockOn()}>
      <div class="pointer-events-none absolute -top-10 left-1/2 z-999 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-(--roundness) bg-main p-4 px-8 text-base text-bg">
        <Fa icon="fa-lock" />
        Caps Lock
      </div>
    </Show>
  );
}
