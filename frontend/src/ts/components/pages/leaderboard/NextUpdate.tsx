import { UTCDateMini } from "@date-fns/utc";
import { differenceInSeconds, endOfDay, endOfWeek } from "date-fns";
import {
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  onCleanup,
} from "solid-js";

import { LeaderboardType } from "../../../states/leaderboard-selection";
import { cn } from "../../../utils/cn";
import { secondsToString } from "../../../utils/date-and-time";

export function NextUpdate(props: {
  type: LeaderboardType;
  class?: string;
}): JSXElement {
  const [tick, setTick] = createSignal(Date.now());

  // Update the tick every second
  createEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    onCleanup(() => clearInterval(interval));
  });

  const nextUpdate = createMemo(() => {
    const now = new Date(tick());
    if (props.type === "daily") {
      const diff = differenceInSeconds(endOfDay(new UTCDateMini()), now);
      return "Next reset in: " + secondsToString(diff, true);
    } else if (props.type === "allTime") {
      const minutesToNextUpdate = 14 - (now.getMinutes() % 15);
      const secondsToNextUpdate = 60 - now.getSeconds();
      const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
      return "Next update in: " + secondsToString(totalSeconds, true);
    } else if (props.type === "weekly") {
      const nextWeekTimestamp = endOfWeek(new UTCDateMini(), {
        weekStartsOn: 1,
      });
      const totalSeconds = differenceInSeconds(nextWeekTimestamp, now);
      return (
        "Next reset in: " +
        secondsToString(totalSeconds, true, true, ":", true, true)
      );
    }
    return "";
  });

  return <div class={cn(`text-sub`, props.class)}>{nextUpdate()}</div>;
}
