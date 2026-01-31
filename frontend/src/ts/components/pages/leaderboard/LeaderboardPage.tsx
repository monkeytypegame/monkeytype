import { JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { getActivePage } from "../../../signals/core";

import { Selection, Sidebar } from "./Sidebar";

export function LeaderboardPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "leaderboards";
  const [selection, setSelection] = createStore<Selection>({
    type: "allTime",
    time: "60",
    friendsOnly: false,
  });
  return (
    <Show when={isOpen}>
      <div class="content-grid grid">
        <div class="flex flex-col gap-8 lg:flex-row">
          <div class="w-full lg:w-60">
            <Sidebar onSelect={setSelection} />
          </div>

          <div class="w-full flex-1">{JSON.stringify(selection)}</div>
        </div>
      </div>
    </Show>
  );
}
