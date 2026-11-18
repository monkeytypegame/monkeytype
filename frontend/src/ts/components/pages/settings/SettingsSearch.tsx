import { JSXElement, onCleanup, Show } from "solid-js";

import {
  getSettingsSearch,
  setSettingsSearch,
} from "../../../states/settings-search";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";

export function SettingsSearch(): JSXElement {
  // reset the filter when leaving the settings page
  onCleanup(() => setSettingsSearch(""));

  return (
    <div class="relative">
      <Fa
        icon="fa-search"
        class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sub"
      />
      <input
        class={cn(
          "w-full rounded border-none bg-sub-alt py-3 pr-10 pl-10",
          "text-em-base text-text caret-main outline-none placeholder:text-sub",
          "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
        )}
        type="text"
        placeholder="search settings"
        autocomplete="off"
        value={getSettingsSearch()}
        onInput={(e) => setSettingsSearch(e.currentTarget.value)}
      />
      <Show when={getSettingsSearch() !== ""}>
        <Button
          variant="text"
          class="absolute top-1/2 right-2 -translate-y-1/2"
          fa={{ icon: "fa-times" }}
          balloon={{ text: "clear search", position: "left" }}
          onClick={() => setSettingsSearch("")}
        />
      </Show>
    </div>
  );
}
