import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { formatDuration, intervalToDuration } from "date-fns";
import { createMemo, JSXElement, Match, Show, Switch } from "solid-js";

import { getConfig } from "../../../config/store";
import { Formatting } from "../../../utils/format";
import { Conditional } from "../../common/Conditional";
import { Fa } from "../../common/Fa";
import { LoadingCircle } from "../../common/LoadingCircle";
import { Table, TableEntry } from "./Table";

export function UserRank(props: {
  type: "speed" | "xp";
  data?: LeaderboardEntry | XpLeaderboardEntry | null;
  minWpm?: number;
  friendsOnly: boolean;
  total: number | undefined;
  memoryDifference: number | undefined;
  isLbOptOut: boolean;
  isBanned: boolean;
  minTimeTyping: number;
  userTimeTyping: number;
}): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));

  const userOverride = () => {
    if (props.data === undefined || props.data === null) {
      return "";
    }
    const rank = props.friendsOnly
      ? (props.data.friendsRank as number)
      : props.data.rank;
    const percentile = (rank / (props.total ?? 1)) * 100;

    let percentileString = `Top ${percentile.toFixed(2)}%`;
    if (rank === 1) {
      percentileString = "GOAT";
    }

    return (
      <div class="text-[1em]">
        <div>You ({percentileString})</div>
        <div class="hidden text-em-xs text-sub sm:block sm:text-em-sm">
          {" "}
          <Show when={props.memoryDifference !== undefined}>
            ({" "}
            <Switch>
              <Match when={props.memoryDifference === 0}>=</Match>
              <Match when={(props.memoryDifference as number) > 0}>
                <>
                  <Fa icon="fa-angle-up" fixedWidth />
                  {Math.abs(props.memoryDifference as number)}
                </>
              </Match>
              <Match when={(props.memoryDifference as number) < 0}>
                <>
                  <Fa icon="fa-angle-down" fixedWidth />
                  {Math.abs(props.memoryDifference as number)}
                </>
              </Match>
            </Switch>{" "}
            since you last checked)
          </Show>
        </div>
      </div>
    );
  };

  return (
    <div class="flex h-18 rounded bg-sub-alt">
      <Show
        when={props.data !== undefined && props.total !== undefined}
        fallback={<LoadingCircle class="w-full text-center text-2xl" />}
      >
        <Conditional
          if={props.data !== null}
          then={
            <Table
              type={props.type}
              entries={[props.data as TableEntry]}
              friendsOnly={props.friendsOnly}
              userOverride={userOverride}
              hideHeader={true}
            />
          }
          else={
            <div class="grid w-full place-items-center p-4 text-center text-sub">
              <Switch fallback="Not qualified">
                <Match when={props.isLbOptOut}>
                  <div>You have opted out of the leaderboards.</div>
                </Match>
                <Match when={props.isBanned}>
                  <div>Your account is banned.</div>
                </Match>
                <Match when={props.userTimeTyping < props.minTimeTyping}>
                  <div>
                    Your account must have{" "}
                    {formatDuration(
                      intervalToDuration({
                        start: 0,
                        end: props.minTimeTyping * 1000,
                      }),
                    )}{" "}
                    typed to be placed on the leaderboard.
                  </div>
                </Match>
                <Match when={props.minWpm !== undefined}>
                  <div>
                    Not qualified (min speed required:{" "}
                    {format().typingSpeed(props.minWpm, {
                      showDecimalPlaces: true,
                      suffix: ` ${format().typingSpeedUnit}`,
                    })}
                    )
                  </div>
                </Match>
              </Switch>
            </div>
          }
        />
      </Show>
    </div>
  );
}
