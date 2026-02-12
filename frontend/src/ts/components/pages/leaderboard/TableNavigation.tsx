import { UTCDateMini } from "@date-fns/utc/date/mini";
import { endOfDay, endOfWeek } from "date-fns";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import {
  JSXElement,
  ParentProps,
  Setter,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

import { LeaderboardType } from "../../../queries/leaderboards";
import { secondsToString } from "../../../utils/date-and-time";
import { ExecReturn, SimpleModal } from "../../../utils/simple-modal";
import { Button } from "../../common/Button";
import { LoadingCircle } from "../../common/LoadingCircle";

export function TableNavigation(
  props: {
    type: LeaderboardType;
    lastPage: number;
    userPage?: number;
    currentPage: number;
    onPageChange: Setter<number>;
    onScrollToUser: Setter<boolean>;
    isLoading?: boolean;
  } & ParentProps,
): JSXElement {
  return (
    <>
      <div class="grid grid-cols-2 items-center justify-between text-base">
        <div>
          <NextUpdate type={props.type} />
        </div>
        <Navigation
          isLoading={props.isLoading}
          lastPage={props.lastPage}
          userPage={props.userPage}
          currentPage={props.currentPage}
          onPageChange={props.onPageChange}
          onScrollToUser={props.onScrollToUser}
        />
      </div>

      {props.children}

      <div class="grid grid-cols-1 items-center justify-between text-base">
        <Navigation
          lastPage={props.lastPage}
          currentPage={props.currentPage}
          onPageChange={props.onPageChange}
          onScrollToUser={props.onScrollToUser}
        />
      </div>
    </>
  );
}

function Navigation(props: {
  lastPage: number;
  userPage?: number;
  currentPage: number;
  onPageChange: Setter<number>;
  onScrollToUser: Setter<boolean>;
  isLoading?: boolean;
}): JSXElement {
  const goToPageModal = new SimpleModal({
    id: "lbGoToPage",
    title: "Go to page",
    inputs: [
      {
        type: "number",
        placeholder: "Page number",
      },
    ],
    buttonText: "Go",
    execFn: async (_thisPopup, pageNumber): Promise<ExecReturn> => {
      const page = parseInt(pageNumber, 10);
      if (isNaN(page) || page < 1) {
        return {
          status: 0,
          message: "Invalid page number",
        };
      }

      props.onPageChange(page - 1);

      return {
        status: 1,
        message: "Navigating to page " + page,
        showNotification: false,
      };
    },
  });
  return (
    <div class="grid grid-flow-col items-center gap-2 justify-self-end [&>button]:px-4">
      <Show when={props.isLoading}>
        <LoadingCircle />
      </Show>
      <Button
        onClick={() => props.onPageChange(0)}
        fa={{ icon: "fa-crown", fixedWidth: true }}
        disabled={props.currentPage === 0}
      />
      <Show when={props.userPage !== undefined}>
        <Button
          onClick={() => {
            props.onPageChange(props.userPage as number);
            props.onScrollToUser(true);
          }}
          fa={{ icon: "fa-user", fixedWidth: true }}
          disabled={
            props.userPage === undefined || props.currentPage === props.userPage
          }
        />
      </Show>
      <Button
        onClick={() =>
          props.onPageChange((old) =>
            Math.max(0, Math.min(old, props.lastPage) - 1),
          )
        }
        fa={{ icon: "fa-chevron-left", fixedWidth: true }}
        disabled={props.currentPage === 0}
      />
      <Button
        onClick={() => goToPageModal.show(undefined, {})}
        fa={{ icon: "fa-hashtag", fixedWidth: true }}
      />
      <Button
        onClick={() => props.onPageChange((old) => old + 1)}
        fa={{ icon: "fa-chevron-right", fixedWidth: true }}
        disabled={props.currentPage + 1 >= props.lastPage}
      />
    </div>
  );
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

  return <div class="text-sub">{nextUpdate()}</div>;
}
