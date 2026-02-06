import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { createMemo, JSXElement, Show } from "solid-js";

import { getConfig } from "../../../signals/config";
import { Formatting } from "../../../utils/format";

export function UserRank(props: {
  type: "wpm" | "xp";
  data?: LeaderboardEntry | XpLeaderboardEntry | null;
  minWpm?: number;
}): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));
  return (
    <div class="flex rounded bg-sub-alt p-4">
      <Show
        when={props.data}
        fallback={
          <div class="w-full p-2 text-center">
            Not qualified
            <Show when={props.minWpm}>
              {" "}
              (min speed required:{" "}
              {format().typingSpeed(props.minWpm, {
                showDecimalPlaces: true,
                suffix: ` ${format().typingSpeedUnit}`,
              })}
              )
            </Show>
          </div>
        }
      >
        foo
      </Show>
    </div>
  );
}
