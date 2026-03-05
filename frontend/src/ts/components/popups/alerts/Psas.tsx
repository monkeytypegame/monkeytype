import { For, JSXElement, Show } from "solid-js";

import { getPsas } from "../../../stores/psas";
import { cn } from "../../../utils/cn";
import { H3 } from "../../common/Headers";

function levelClass(level: number): string {
  if (level === -1) return "bg-error";
  if (level === 1) return "bg-main";
  return "bg-sub";
}

export function Psas(): JSXElement {
  return (
    <div>
      <H3 fa={{ icon: "fa-bullhorn" }} text="Announcements" class="text-xl" />
      <Show
        when={getPsas().length > 0}
        fallback={
          <div class="grid min-h-20 place-items-center">
            <div>Nothing to show</div>
          </div>
        }
      >
        <div class="grid min-h-20 gap-4">
          <For each={getPsas()}>
            {(psa) => (
              <div class="grid h-min grid-cols-[0.25rem_1fr] gap-x-2">
                <div
                  class={cn(
                    "h-full w-1 rounded-sm transition-colors duration-125",
                    levelClass(psa.level),
                  )}
                ></div>
                <div class="text-xs wrap-break-word text-text">
                  {psa.message}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
