import { UTCDateMini } from "@date-fns/utc/date/mini";
import {
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";
import { format as dateFormat } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import { Selection } from "../../../queries/leaderboards";
import { capitalizeFirstLetter } from "../../../utils/strings";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";

export function Title(props: {
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
    <div>
      <H2 text={title()} class="p-0 text-2xl md:text-3xl xl:text-4xl" />
      <Show when={subTitle() !== null}>
        <div class="flex items-center gap-2">
          <div
            class="text-sub"
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
    </div>
  );
}

function utcToLocalDate(timestamp: UTCDateMini): Date {
  return subMinutes(timestamp, new Date().getTimezoneOffset());
}
