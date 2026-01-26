import { PersonalBest } from "@monkeytype/schemas/shared";
import { Friend } from "@monkeytype/schemas/users";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { formatDuration } from "date-fns/formatDuration";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { createResource, JSXElement, Show } from "solid-js";

import Ape from "../../../ape";
import { SupportsFlags } from "../../../controllers/user-flag-controller";
import { getActivePage, getUserId } from "../../../signals/core";
import { secondsToString } from "../../../utils/date-and-time";
import Format from "../../../utils/format";
import { getXpDetails } from "../../../utils/levels";
import { formatTypingStatsRatio } from "../../../utils/misc";
import { getLanguageDisplayString } from "../../../utils/strings";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { LoadingCircle } from "../../common/Loader";
import { User } from "../../common/User";
import { DataTable } from "../../ui/table/DataTable";
import { TableColumnHeader } from "../../ui/table/TableColumnHeader";

const FriendName = (props: {
  friend: Pick<Friend, "uid" | "name" | "badgeId"> & SupportsFlags;
}): JSXElement => {
  return <User user={props.friend} />;
};

const columnHelper = createColumnHelper<Friend>();
const defineColumn = columnHelper.accessor;
const columns = [
  defineColumn("name", {
    header: (props) => <TableColumnHeader column={props.column} title="name" />,
    enableSorting: true,
    cell: (info) => <FriendName friend={info.row.original} />,
  }),

  defineColumn("lastModified", {
    header: (props) => (
      <TableColumnHeader
        column={props.column}
        title="friends for"
        class="whitespace-nowrap"
      />
    ),
    enableSorting: true,
    cell: ({ getValue }) =>
      getValue() === undefined ? "-" : formatAge(getValue(), "short"),
    meta: {
      cellMeta: ({ value }) =>
        value === undefined
          ? {}
          : {
              "data-balloon-pos": "down",
              "aria-label": `since ${dateFormat(value, "dd MMM yyy HH:mm")}`,
            },
    },
  }),

  defineColumn("xp", {
    header: (props) => (
      <TableColumnHeader column={props.column} title="level" />
    ),
    enableSorting: true,
    cell: ({ getValue }) => getXpDetails(getValue() ?? 0).level,
  }),

  defineColumn("completedTests", {
    header: (props) => (
      <TableColumnHeader
        column={props.column}
        title="tests"
        aria-label="completed / started"
        data-balloon-pos="down"
      />
    ),
    enableSorting: true,
    cell: (info) => `${info.getValue()}/${info.row.original.startedTests}`,
    meta: {
      breakpoint: "lg",
      cellMeta: ({ row }) => {
        const testStats = formatTypingStatsRatio(row);

        return {
          "data-balloon-pos": "down",
          "aria-label": `${testStats.completedPercentage}% (${
            testStats.restartRatio
          } restarts per completed test)`,
        };
      },
    },
  }),

  defineColumn("timeTyping", {
    header: (props) => (
      <TableColumnHeader
        column={props.column}
        title="time typing"
        class="whitespace-nowrap"
      />
    ),
    enableSorting: true,
    cell: ({ getValue }) =>
      secondsToString(Math.round(getValue() ?? 0), true, true),
    meta: {
      breakpoint: "sm",
    },
  }),

  defineColumn("streak.length", {
    header: (props) => (
      <TableColumnHeader column={props.column} title="streak" />
    ),
    enableSorting: true,
    cell: ({ getValue }) => formatStreak(getValue()),
    meta: {
      breakpoint: "sm",
      cellMeta: ({ row }) => {
        const value = row.streak.maxLength as number | undefined;
        return value === undefined
          ? {}
          : {
              "data-balloon-pos": "down",
              "aria-label": formatStreak(value, "longest streak"),
            };
      },
    },
  }),

  defineColumn("top15.wpm", {
    header: (props) => (
      <TableColumnHeader column={props.column} title="time 15 pb" />
    ),
    enableSorting: true,
    cell: (info) => {
      const pb = formatPb(info.row.original.top15);
      return (
        <>
          {pb?.wpm ?? "-"}
          <div class="opacity-50">{pb?.acc ?? "-"}</div>
        </>
      );
    },
    meta: {
      breakpoint: "lg",
      cellMeta: ({ row }) => ({
        "data-balloon-pos": "down",
        "data-balloon-break": "",
        "aria-label": formatPb(row.top15 as PersonalBest)?.details,
      }),
    },
  }),

  defineColumn("top60.wpm", {
    header: (props) => (
      <TableColumnHeader column={props.column} title="time 60 pb" />
    ),
    enableSorting: true,
    cell: (info) => {
      const pb = formatPb(info.row.original.top60);
      return (
        <>
          {pb?.wpm ?? "-"}
          <div class="opacity-50">{pb?.acc ?? "-"}</div>
        </>
      );
    },
    meta: {
      breakpoint: "lg",
      cellMeta: ({ row }) => ({
        "data-balloon-pos": "down",
        "data-balloon-break": "",
        "aria-label": formatPb(row.top60)?.details,
      }),
    },
  }),

  defineColumn("connectionId", {
    header: "",
    cell: (info) =>
      //check the row is our own user
      info.getValue() !== undefined ? (
        <Button
          onClick={() => {
            alert(
              `remove friend ${info.row.original.name} with connectionId ${info.getValue()}`,
            );
          }}
          fa={{ icon: "fa-user-times", fixedWidth: true }}
        />
      ) : (
        ""
      ),
  }),
];

export function FriendsList(): JSXElement {
  const isOpen = (): boolean =>
    getActivePage() === "friends" && getUserId() !== null;

  const [friendsListResource, { refetch: refreshFriendsList }] = createResource(
    isOpen,
    async (open: boolean) => {
      if (!open) return undefined;
      const response = await Ape.users.getFriends();
      if (response.status !== 200) {
        throw new Error(response.body.message);
      }
      return response.body.data;
    },
  );

  return (
    <Show when={getUserId() !== null}>
      <div class="items-bottom flex">
        <H2 text="Friends" fa={{ icon: "fa-user-friends", fixedWidth: true }} />
        <Show when={friendsListResource.state === "refreshing"}>
          <LoadingCircle />
        </Show>
        <Button
          fa={{ icon: "fa-plus", fixedWidth: true }}
          class="ml-auto"
          text="add friend"
          onClick={() => {
            void refreshFriendsList();
          }}
        />
      </div>

      <AsyncContent
        resource={friendsListResource}
        alwaysShowContent={friendsListResource.state === "refreshing"}
      >
        {(data: Friend[] | undefined) => (
          <DataTable
            id="friendsList"
            columns={columns}
            data={data ?? []}
            fallback={
              <div class="text-sub text-center">
                You don&lsquo;t have any friends :(
              </div>
            }
          />
        )}
      </AsyncContent>
    </Show>
  );
}

function formatAge(
  timestamp: number | undefined,
  format?: "short" | "full",
): string {
  if (timestamp === undefined) return "";
  let formatted = "";
  const duration = intervalToDuration({ start: timestamp, end: Date.now() });

  if (format === undefined || format === "full") {
    formatted = formatDuration(duration, {
      format: ["years", "months", "days", "hours", "minutes"],
    });
  } else {
    formatted = formatDistanceToNow(timestamp);
  }

  return formatted !== "" ? formatted : "less then a minute";
}

function formatStreak(length?: number, prefix?: string): string {
  if (length === 1) return "-";
  return isSafeNumber(length)
    ? `${prefix !== undefined ? prefix + " " : ""}${length} days`
    : "-";
}

function formatPb(entry?: PersonalBest):
  | {
      wpm: string;
      acc: string;
      raw: string;
      con: string;
      details: string;
    }
  | undefined {
  if (entry === undefined) {
    return undefined;
  }
  const result = {
    wpm: Format.typingSpeed(entry.wpm, { showDecimalPlaces: true }),
    acc: Format.percentage(entry.acc, { showDecimalPlaces: true }),
    raw: Format.typingSpeed(entry.raw, { showDecimalPlaces: true }),
    con: Format.percentage(entry.consistency, { showDecimalPlaces: true }),
    details: "",
  };

  const details = [
    `${getLanguageDisplayString(entry.language)}`,
    `${result.wpm} wpm`,
  ];

  if (isSafeNumber(entry.acc)) {
    details.push(`${result.acc} acc`);
  }
  if (isSafeNumber(entry.raw)) {
    details.push(`${result.raw} raw`);
  }
  if (isSafeNumber(entry.consistency)) {
    details.push(`${result.con} con`);
  }
  if (isSafeNumber(entry.timestamp)) {
    details.push(`${dateFormat(entry.timestamp, "dd MMM yyyy")}`);
  }

  result.details = details.join("\n");

  return result;
}
