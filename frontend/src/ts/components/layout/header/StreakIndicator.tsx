import { JSXElement, Show } from "solid-js";

import { getStreakIndicatorState } from "../../../states/streak";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function StreakIndicator(): JSXElement {
  const state = getStreakIndicatorState;
  const flameClass = (): string =>
    cn(
      "transition-colors",
      state().claimedToday
        ? "text-main"
        : "text-sub [-webkit-text-fill-color:transparent] [-webkit-text-stroke:0.075em_var(--sub-color)]",
    );

  return (
    <Show when={state().show}>
      <Button
        variant="text"
        href="/account"
        router-link
        class={cn("h-full min-w-8 px-2 tabular-nums", {
          "opacity-(--nav-focus-opacity)": getFocus(),
        })}
        dataset={{
          "data-nav-item": "streak",
        }}
        fa={{
          icon: "fa-fire",
          fixedWidth: true,
          class: flameClass(),
        }}
        balloon={{
          text: state().hoverText,
          position: "down",
          break: true,
          length: "large",
        }}
      >
        <Show when={state().label}>
          {(label) => <span class="text-text">{label()}</span>}
        </Show>
      </Button>
    </Show>
  );
}
