import { For, JSXElement, Show } from "solid-js";

import { getPsas } from "../../../stores/alerts";
import { cn } from "../../../utils/cn";
import { H2 } from "../../common/Headers";

function levelClass(level: number): string {
  if (level === -1) return "bg-error";
  if (level === 1) return "bg-main";
  return "bg-sub";
}

export function Psas(): JSXElement {
  return (
    <div>
      <H2 fa={{ icon: "fa-bullhorn" }} text="Announcements" class="text-lg" />
      <Show
        when={getPsas().length > 0}
        fallback={
          <div class="my-8 text-center text-xs text-text">Nothing to show</div>
        }
      >
        <div class="grid gap-4">
          <For each={getPsas()}>
            {(psa) => (
              <div class="grid grid-cols-[0.25rem_1fr] gap-x-2">
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
