import { createMemo, JSXElement, Show } from "solid-js";

import {
  ResultsQuery,
  ResultStats,
  useResultStatsLiveQuery,
} from "../../../collections/results";
import { getConfig } from "../../../signals/config";
import { secondsToString } from "../../../utils/date-and-time";
import { Formatting } from "../../../utils/format";
import { Fa } from "../../common/Fa";

export function TestStats(props: { resultsQuery: ResultsQuery }): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));
  const formatWpm = (val: number): string =>
    format().typingSpeed(val, { showDecimalPlaces: true });
  const formatPercentage = (val: number): string =>
    format().percentage(val, { showDecimalPlaces: true });

  const statsQuery = useResultStatsLiveQuery(props.resultsQuery);
  const last10StatsQuery = useResultStatsLiveQuery(props.resultsQuery, {
    lastTen: true,
  });

  const stats = createMemo<ResultStats>(() => statsQuery()[0] as ResultStats);
  const last10 = createMemo<ResultStats>(
    () => last10StatsQuery()[0] as ResultStats,
  );

  //TODO use asynccontent or loader
  return (
    <Show
      when={
        statsQuery.isReady &&
        last10StatsQuery.isReady &&
        stats() !== undefined &&
        last10() !== undefined
      }
    >
      <div class="flex items-center justify-center text-sub">
        estimate words typed{" "}
        <span class="p-5 text-5xl text-text lg:text-5xl">{stats().words}</span>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <Stat
          header="tests started"
          value={stats().restarted + stats().completed}
        />
        <div>
          <div class="text-sub">
            tests completed{" "}
            <span
              data-balloon-length="xlarge"
              data-balloon-pos="up"
              aria-label="Due to the increasing number of results in the database, you can now only see your last 1000 results in detail. Total time spent typing, started and completed tests stats will still be up to date at the top of the page, above the filters."
              role="alertdialog"
            >
              <Fa icon="fa-question-circle" />
            </span>
          </div>
          <div class="text-2xl leading-[1.1] md:text-3xl lg:text-5xl">
            {stats().completed}(
            {Math.floor(
              ((stats().completed + stats().restarted) /
                (stats().completed + 2 * stats().restarted)) *
                100,
            )}
            %)
          </div>
          <div class="text-xs">
            {(
              stats().restarted /
              (stats().restarted + stats().completed)
            ).toFixed(1)}{" "}
            restarts per completed test
          </div>
        </div>

        <Stat
          header="time typing"
          value={stats().timeTyping}
          formatter={(val) => secondsToString(Math.round(val), true, true)}
        />

        <Stat
          header={`highest ${format().typingSpeedUnit}`}
          value={stats().maxWpm}
          formatter={formatWpm}
        />
        <Stat
          header={`average ${format().typingSpeedUnit}`}
          value={stats().avgWpm}
          formatter={formatWpm}
        />
        <Stat
          header={`average ${format().typingSpeedUnit} (last 10 tests)`}
          value={last10().avgWpm}
          formatter={formatWpm}
        />

        <Stat
          header={`highest raw ${format().typingSpeedUnit}`}
          value={stats().maxRaw}
          formatter={formatWpm}
        />
        <Stat
          header={`average raw ${format().typingSpeedUnit}`}
          value={stats().avgRaw}
          formatter={formatWpm}
        />
        <Stat
          header={`average raw ${format().typingSpeedUnit} (last 10 tests)`}
          value={last10().avgRaw}
          formatter={formatWpm}
        />

        <Stat
          header={`highest acc`}
          value={stats().maxAcc}
          formatter={formatPercentage}
        />
        <Stat
          header={`average acc`}
          value={stats().avgAcc}
          formatter={formatPercentage}
        />
        <Stat
          header={`average acc (last 10 tests)`}
          value={last10().avgAcc}
          formatter={formatPercentage}
        />

        <Stat
          header={`highest consistency`}
          value={stats().maxConsistency}
          formatter={formatPercentage}
        />
        <Stat
          header={`average consistency`}
          value={stats().avgConsistency}
          formatter={formatPercentage}
        />
        <Stat
          header={`average consistency (last 10 tests)`}
          value={last10().avgConsistency}
          formatter={formatPercentage}
        />
      </div>
    </Show>
  );
}

function Stat(options: {
  header: string;
  value: number | undefined;
  formatter?: (value: number) => string;
}): JSXElement {
  return (
    <div>
      <div class="text-sub">{options.header}</div>

      <div class="text-2xl leading-[1.1] md:text-3xl lg:text-5xl">
        <Show when={options.value !== undefined}>
          {options.formatter !== undefined
            ? options.formatter(options.value ?? -1)
            : options.value}
        </Show>
      </div>
    </div>
  );
}
