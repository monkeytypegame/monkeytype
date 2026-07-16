import { Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getCompositionText, isOutOfFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";

export function CompositionDisplay() {
  return (
    <Show when={getConfig.compositionDisplay === "below"}>
      <div
        class={cn("mt-4 w-full text-center text-sub select-none", {
          "opacity-25 blur-xs": isOutOfFocus(),
        })}
        style={{
          "font-size": `${getConfig.fontSize}rem`,
          // instant unblur, 0.25s fade to blur — matches the imperative #words path
          transition: isOutOfFocus() ? "0.25s" : "none",
        }}
      >
        {getCompositionText()}
      </div>
    </Show>
  );
}
