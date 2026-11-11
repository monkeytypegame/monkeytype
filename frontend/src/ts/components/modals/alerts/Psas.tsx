import { For, JSXElement, Show } from "solid-js";

import { AlertPsa, getPsas } from "../../../states/psas";
import { cn } from "../../../utils/cn";
import { H3 } from "../../common/Headers";
import { AlertsSection } from "./AlertsSection";

function levelClass(level: number): string {
  if (level === -1) return "bg-error";
  if (level === 1) return "bg-main";
  return "bg-sub";
}

export function Psas(): JSXElement {
  return (
    <AlertsSection
      title={<H3 fa={{ icon: "fa-bullhorn" }} text="Announcements" />}
      body={
        <Show
          when={getPsas().length > 0}
          fallback={<div class="place-self-center">Nothing to show</div>}
        >
          <div class="flex flex-col content-start gap-4 place-self-start">
            <For each={getPsas()}>{(psa) => <Psa psa={psa} />}</For>
          </div>
        </Show>
      }
    />
  );
}

function Psa(props: { psa: AlertPsa }): JSXElement {
  return (
    <div class="grid h-min grid-cols-[0.25rem_1fr] gap-x-2">
      <div
        class={cn(
          "h-full w-1 rounded-sm transition-colors duration-125",
          levelClass(props.psa.level),
        )}
      ></div>
      <div class="text-xs wrap-break-word text-text">{props.psa.message}</div>
    </div>
  );
}
