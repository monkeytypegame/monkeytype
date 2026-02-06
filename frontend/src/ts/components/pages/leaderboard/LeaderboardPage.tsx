import { UTCDateMini } from "@date-fns/utc/date/mini";
import { useQuery } from "@tanstack/solid-query";
import {
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import { format as dateFormat } from "date-fns/format";
import {
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  onCleanup,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";

import { queryClient } from "../../../queries";
import {
  getLeaderboardQueryOptions,
  LeaderboardType,
  Selection,
} from "../../../queries/leaderboards";
import { getActivePage, isLoggedIn } from "../../../signals/core";
import { secondsToString } from "../../../utils/date-and-time";
import { qsr } from "../../../utils/dom";
import { addToGlobal } from "../../../utils/misc";
import { capitalizeFirstLetter } from "../../../utils/strings";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";

import { LeaderboardTable } from "./LeaderboardTable";
import { Sidebar } from "./Sidebar";

//TODO update page name
qsr("nav .view-about").on("mouseenter", () => {
  prefetch();
});

export function LeaderboardPage(): JSXElement {
  //TODO update page
  const isOpen = (): boolean => getActivePage() === "about";
  const [selection, setSelection] = createStore<Selection>({
    type: "allTime",
    mode: "time",
    mode2: "15",
    friendsOnly: false,
  });

  const [page, setPage] = createSignal(0);
  const onSelectionChange = (selection: Selection): void => {
    setSelection(selection);
    setPage(0);
  };

  addToGlobal({ selection });
  createEffect(() => {
    //TODO fetch previous page as well, check boundaries
    if (isOpen()) {
      void queryClient.prefetchQuery(
        getLeaderboardQueryOptions({
          ...selection,
          page: page() + 1,
        }),
      );
    }
  });

  const query = useQuery(() => ({
    ...getLeaderboardQueryOptions({
      ...selection,
      previous: false,
      page: page() ?? 0,
    }),
    enabled: isOpen(),
  }));

  return (
    <div class="content-grid grid">
      <div class="flex flex-col gap-8 lg:flex-row">
        <div class="w-full lg:w-60">
          <Sidebar onSelect={onSelectionChange} />
        </div>

        <div class="w-full flex-1">
          <Title
            selection={selection}
            onPreviousSelect={() => setSelection("previous", (old) => !old)}
          />

          <Show when={isLoggedIn()}>
            <LeaderboardTable
              type={selection.type === "weekly" ? "xp" : "wpm"}
              entries={[
                {
                  uid: "0",
                  name: "You",
                  timestamp: 0,
                  timeTypedSeconds: 0,
                  totalXp: 0,
                  lastActivityTimestamp: 0,
                },
              ]}
              hideHeader
            />
          </Show>
          <Show when={query.isLoading}>loading....</Show>
          <Show when={query.isRefetching}>loading updating...</Show>
          <div class="grid grid-cols-2 items-center justify-between text-base">
            <div>
              <NextUpdate type={selection.type} />
            </div>
            <div class="grid grid-flow-col items-center gap-2 justify-self-end">
              <Button
                onClick={() => setPage(0)}
                fa={{ icon: "fa-crown", fixedWidth: true }}
                disabled={page() === 0}
              />
              <Button
                onClick={() => setPage(2)}
                fa={{ icon: "fa-user", fixedWidth: true }}
                disabled={page() === 2}
              />
              <Button
                onClick={() => setPage((old) => old - 1)}
                fa={{ icon: "fa-chevron-left", fixedWidth: true }}
                disabled={page() === 0}
              />
              <Button
                onClick={() => setPage((old) => old - 1)}
                fa={{ icon: "fa-hashtag", fixedWidth: true }}
              />
              <Button
                onClick={() => setPage((old) => old + 1)}
                fa={{ icon: "fa-chevron-right", fixedWidth: true }}
                disabled={
                  page() + 1 >= Math.ceil((query.data?.count ?? 0) / 50)
                }
              />
            </div>
          </div>
          <AsyncContent query={query}>
            {(data) => (
              <LeaderboardTable
                type={selection.type === "weekly" ? "xp" : "wpm"}
                entries={data.entries}
                friendsOnly={selection.friendsOnly}
              />
            )}
          </AsyncContent>
        </div>
      </div>
    </div>
  );
}

function Title(props: {
  selection: Selection;
  onPreviousSelect: () => void;
}): JSXElement {
  const title = createMemo(() => {
    const type =
      props.selection.type === "allTime"
        ? "All-time"
        : props.selection.type === "weekly"
          ? "Weekly XP"
          : "Daily";

    const friend = props.selection.friendsOnly ? "Friends " : "";

    const language = capitalizeFirstLetter(props.selection.language ?? "");

    const mode =
      props.selection.type !== "weekly"
        ? ` ${capitalizeFirstLetter(props.selection.mode ?? "")} ${props.selection.mode2}`
        : "";
    return `${type} ${language} ${mode} ${friend}Leaderboard`;
  });

  const subTitle = createMemo(() => {
    const utcDateFormat = "EEEE, do MMMM yyyy";
    const localDateFormat = "EEEE, do MMMM yyyy HH:mm";
    const toLocalString = (
      timestamp: UTCDateMini,
      endTimestamp: UTCDateMini,
    ): string =>
      `local time\n${dateFormat(utcToLocalDate(timestamp), localDateFormat)} -\n${dateFormat(utcToLocalDate(endTimestamp), localDateFormat)}`;

    if (props.selection.type === "daily") {
      let timestamp = startOfDay(new UTCDateMini());
      if (props.selection.previous) {
        timestamp = subHours(timestamp, 24);
      }
      const endTimestamp = endOfDay(timestamp);
      return {
        dateString: dateFormat(timestamp, utcDateFormat) + " UTC",
        localString: toLocalString(timestamp, endTimestamp),
        buttonText: props.selection.previous ? "show today" : "show yesterday",
      };
    } else if (props.selection.type === "weekly") {
      let timestamp = startOfWeek(new UTCDateMini(), { weekStartsOn: 1 });
      if (props.selection.previous) {
        timestamp = subDays(timestamp, 7);
      }
      const endTimestamp = endOfWeek(timestamp, { weekStartsOn: 1 });

      return {
        dateString: `${dateFormat(timestamp, utcDateFormat)} - ${dateFormat(endTimestamp, utcDateFormat)} UTC`,
        localString: toLocalString(timestamp, endTimestamp),
        buttonText: props.selection.previous
          ? "show this week"
          : "show last week",
      };
    }
    return null;
  });

  return (
    <>
      <H2 text={title()} class="p-0" />
      <Show when={subTitle() !== null}>
        <div class="flex items-center gap-2">
          <div
            data-balloon-pos="down"
            data-balloon-break
            aria-label={subTitle()?.localString}
          >
            {subTitle()?.dateString}
          </div>
          <div class="h-[1.75em] w-[0.25em] rounded bg-sub-alt"></div>
          <Button
            text={subTitle()?.buttonText}
            type="text"
            onClick={props.onPreviousSelect}
            fa={{
              icon: props.selection.previous ? "fa-forward" : "fa-backward",
              variant: "solid",
            }}
          />
        </div>
      </Show>
    </>
  );
}

function utcToLocalDate(timestamp: UTCDateMini): Date {
  return subMinutes(timestamp, new Date().getTimezoneOffset());
}

function NextUpdate(props: { type: LeaderboardType }): JSXElement {
  const [tick, setTick] = createSignal(Date.now());

  // Update the tick every second
  createEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    onCleanup(() => clearInterval(interval));
  });

  const nextUpdate = createMemo(() => {
    const now = new Date(tick());
    if (props.type === "daily") {
      const diff = differenceInSeconds(now, endOfDay(new UTCDateMini()));
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
      const totalSeconds = differenceInSeconds(now, nextWeekTimestamp);
      return (
        "Next reset in: " +
        secondsToString(totalSeconds, true, true, ":", true, true)
      );
    }
    return "";
  });

  return <div>{nextUpdate()}</div>;
}

function prefetch(): void {
  void queryClient.prefetchQuery(
    getLeaderboardQueryOptions({
      type: "allTime",
      mode: "time",
      mode2: "15",
      language: "english",
      friendsOnly: false,
      page: 0,
      previous: false,
    }),
  );
}
