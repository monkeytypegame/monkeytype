import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { createMemo, JSXElement, Match, Show, Switch } from "solid-js";

import { getConfig } from "../../../signals/config";
import { Formatting } from "../../../utils/format";
import { Fa } from "../../common/Fa";
import { LoadingCircle } from "../../common/LoadingCircle";

import { Table, TableEntry } from "./Table";

export function UserRank(props: {
  type: "wpm" | "xp";
  data?: LeaderboardEntry | XpLeaderboardEntry | null;
  minWpm?: number;
  friendsOnly: boolean;
  total: number | undefined;
  memoryDifference: number | undefined;
}): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));
  const userOverride = (): JSXElement => {
    if (
      props.data === undefined ||
      props.data === null ||
      props.total === undefined
    ) {
      return "";
    }
    const rank = props.friendsOnly
      ? (props.data.friendsRank as number)
      : props.data.rank;
    const percentile = (rank / props.total) * 100;

    let percentileString = `Top ${percentile.toFixed(2)}%`;
    if (rank === 1) {
      percentileString = "GOAT";
    }

    return (
      <>
        <div>You ({percentileString})</div>
        <div class="text-xs text-sub">
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
      </>
    );
  };
  return (
    <div class="flex rounded bg-sub-alt">
      <Show
        when={props.data !== undefined}
        fallback={<LoadingCircle class="w-full p-4 text-center" />}
      >
        <Show
          when={props.data}
          fallback={
            <div class="w-full p-4 text-center">
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
          <Table
            type={props.type}
            entries={[props.data as TableEntry]}
            friendsOnly={props.friendsOnly}
            userOverride={userOverride}
            hideHeader={true}
          />
        </Show>
      </Show>
    </div>
  );
}
