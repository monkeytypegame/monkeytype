import { createMemo, For, Show } from "solid-js";

import { getAuthenticatedUser } from "../../../firebase";
import { rematch, leaveCurrentRoom } from "../../../multiplayer/actions";
import { getRoom, getRaceResults } from "../../../states/multiplayer";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";

export function RaceResultsPage() {
  const myUid = () => getAuthenticatedUser()?.uid;
  const isHost = () => getRoom()?.hostUid === myUid();

  const ranked = createMemo(() =>
    [...(getRaceResults() ?? [])].sort((a, b) => {
      if (a.finalResult === null) return 1;
      if (b.finalResult === null) return -1;
      return b.finalResult.wpm - a.finalResult.wpm;
    }),
  );

  return (
    <div class="content-grid grid gap-8">
      <H2
        text="Race results"
        fa={{ icon: "fa-flag-checkered", fixedWidth: true }}
      />

      <div class="grid gap-2">
        <For each={ranked()}>
          {(player, index) => (
            <div class="flex items-center gap-4 rounded bg-sub-alt p-[0.5em]">
              <span class="w-6 text-center text-sub">#{index() + 1}</span>
              <span class="flex-1">{player.name}</span>
              <Show
                when={player.finalResult}
                fallback={<span class="text-sub">did not finish</span>}
              >
                {(finalResult) => (
                  <>
                    <span>{Math.round(finalResult().wpm)} wpm</span>
                    <span class="text-sub">
                      {Math.round(finalResult().acc)}% acc
                    </span>
                  </>
                )}
              </Show>
            </div>
          )}
        </For>
      </div>

      <div class="flex gap-4">
        <Show when={isHost()}>
          <Button
            text="Play again"
            fa={{ icon: "fa-redo-alt", fixedWidth: true }}
            onClick={() => rematch()}
          />
        </Show>
        <Button
          text="Leave room"
          fa={{ icon: "fa-door-open", fixedWidth: true }}
          onClick={() => leaveCurrentRoom()}
        />
      </div>
    </div>
  );
}
