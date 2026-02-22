import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Accessor, createMemo, JSXElement } from "solid-js";

import { isFriend } from "../../../db";
import { createEffectOn } from "../../../hooks/effects";
import { bp } from "../../../signals/breakpoints";
import { getConfig } from "../../../signals/config";
import { getUserId } from "../../../signals/core";
import { secondsToString } from "../../../utils/date-and-time";
import { qs } from "../../../utils/dom";
import { Formatting } from "../../../utils/format";
import { abbreviateNumber } from "../../../utils/numbers";
import { Conditional } from "../../common/Conditional";
import { Fa } from "../../common/Fa";
import { User } from "../../common/User";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";

type SpeedEntry = LeaderboardEntry;
type XpEntry = XpLeaderboardEntry;
export type TableEntry = SpeedEntry | XpEntry;

export function Table(
  props: {
    type: "speed" | "xp";
    entries: TableEntry[];
    friendsOnly: boolean;
    hideHeader?: true;
  } & (
    | {
        scrollToUser: Accessor<boolean>;
        onScrolledToUser: () => void;
        userOverride?: never;
      }
    | {
        scrollToUser?: never;
        onScrolledToUser?: never;
        userOverride: Accessor<JSXElement>;
      }
  ),
): JSXElement {
  const commonProps = createMemo(() => ({
    id: "leaderboardTable",
    hideHeader: props.hideHeader,
    class:
      "table-auto [&>tbody>tr>td]:whitespace-nowrap [&>tbody>tr>td]:py-2.5 [&>tbody>tr>td]:px-4 [&>thead>tr>th]:px-4 xl:[&>tbody>tr>td]:px-6 xl:[&>tbody>tr>td]:py-1 xl:[&>thead>tr>th]:px-6",
    rowSelection:
      props.userOverride !== undefined
        ? undefined
        : {
            getRowId: (row: { uid: string }) => row.uid,
            activeRow: getUserId,
            class: "text-main [&>td>div]:text-main [&>td>div>a]:text-main",
          },
  }));

  const speedColumns = createMemo(() =>
    getSpeedColumns({
      friendsOnly: props.friendsOnly,
      format: new Formatting(getConfig),
      userOverride: props.userOverride,
      addHeader: props.userOverride !== undefined && bp().xl,
    }),
  );
  const xpColumns = createMemo(() =>
    getXpColumns({
      friendsOnly: props.friendsOnly,
      userOverride: props.userOverride,
      addHeader: props.userOverride !== undefined && bp().xl,
    }),
  );

  createEffectOn(
    () => props.scrollToUser?.(),
    (enabled) => {
      if (enabled) {
        requestAnimationFrame(() => {
          qs("#leaderboardTable tr[data-state='selected']")?.scrollIntoView({
            block: "center",
          });
          props.onScrolledToUser?.();
        });
      }
    },
  );

  return (
    <Conditional
      if={props.type === "speed"}
      then={
        <DataTable
          {...commonProps()}
          columns={speedColumns()}
          data={props.entries as LeaderboardEntry[]}
        />
      }
      else={
        <DataTable
          {...commonProps()}
          columns={xpColumns()}
          data={props.entries as XpLeaderboardEntry[]}
        />
      }
    />
  );
}

function getSpeedColumns({
  friendsOnly,
  format,
  userOverride,
  addHeader,
}: {
  friendsOnly: boolean;
  format: Formatting;
  userOverride?: Accessor<JSXElement>;
  addHeader?: boolean;
}): DataTableColumnDef<SpeedEntry>[] {
  const defineColumn = createColumnHelper<SpeedEntry>().accessor;
  const columns = [
    defineColumn("friendsRank", {
      header: () => <Fa icon="fa-user-friends" />,
      cell: (info) =>
        info.getValue() === 1 ? <Fa icon="fa-crown" /> : info.getValue(),
      meta: {
        align: "center",
        headerMeta: {
          "aria-label": "Friends rank",
          "data-balloon-pos": "down",
        },
      },
    }),
    defineColumn("rank", {
      header: () => <Fa icon={friendsOnly ? "fa-users" : "fa-hashtag"} />,
      cell: (info) =>
        info.getValue() === 1 ? <Fa icon="fa-crown" /> : info.getValue(),
      meta: {
        align: "center",
        headerMeta: {
          "aria-label": "Global rank",
          "data-balloon-pos": "down",
        },
      },
    }),
    defineColumn("uid", {
      header: "name",
      cell: (info) =>
        userOverride?.() ?? (
          <User
            user={info.row.original}
            isFriend={isFriend(info.row.original.uid)}
          />
        ),
      meta: {
        cellMeta: () => ({ class: "w-full" }),
      },
    }),
    defineColumn("wpm", {
      header: format.typingSpeedUnit,
      cell: (info) =>
        wrapWithHeader({
          value: format.typingSpeed(info.getValue(), {
            showDecimalPlaces: true,
          }),
          header: format.typingSpeedUnit,
          enabled: addHeader,
        }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("acc", {
      header: "accuracy",
      cell: (info) =>
        wrapWithHeader({
          value: format.percentage(info.getValue(), {
            showDecimalPlaces: true,
          }),
          header: "accuracy",
          enabled: addHeader,
        }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("wpm", {
      id: "wpmAcc",
      header: () => (
        <>
          <div>{format.typingSpeedUnit}</div>
          <div class="opacity-50">accuracy</div>
        </>
      ),
      cell: (info) => (
        <>
          <div>
            {format.typingSpeed(info.row.original.wpm, {
              showDecimalPlaces: true,
            })}
          </div>
          <div class="text-sub">
            {format.percentage(info.row.original.acc, {
              showDecimalPlaces: true,
            })}
          </div>
        </>
      ),
      meta: {
        align: "right",
        maxBreakpoint: "xl",
      },
    }),
    defineColumn("raw", {
      header: "raw",
      cell: (info) =>
        wrapWithHeader({
          value: format.typingSpeed(info.getValue(), {
            showDecimalPlaces: true,
          }),
          header: "raw",
          enabled: addHeader,
        }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("consistency", {
      header: "consistency",
      cell: (info) =>
        wrapWithHeader({
          value: format.percentage(info.getValue(), {
            showDecimalPlaces: true,
          }),
          header: "consistency",
          enabled: addHeader,
        }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("raw", {
      id: "rawCon",
      header: () => (
        <>
          <div>raw</div>
          <div class="opacity-50">consistency</div>
        </>
      ),
      cell: (info) => (
        <>
          <div>
            {format.typingSpeed(info.row.original.raw, {
              showDecimalPlaces: true,
            })}
          </div>
          <div class="text-sub">
            {" "}
            {format.percentage(info.row.original.consistency, {
              showDecimalPlaces: true,
            })}
          </div>
        </>
      ),
      meta: {
        align: "right",
        maxBreakpoint: "xl",
      },
    }),
    defineColumn("timestamp", {
      header: "date",
      cell: (info) =>
        info.getValue() !== undefined ? (
          addHeader ? (
            wrapWithHeader({
              value: dateFormat(info.getValue(), "dd MMM yyyy HH:mm"),
              header: "date",
              enabled: true,
            })
          ) : (
            <>
              <div>{dateFormat(info.getValue(), "dd MMM yyyy")}</div>
              <div class="text-sub">{dateFormat(info.getValue(), "HH:mm")}</div>
            </>
          )
        ) : (
          ""
        ),
      meta: {
        align: "right",
      },
    }),
  ];

  //remove first column if not friendsOnly
  if (!friendsOnly) {
    columns.shift();
  }

  //mark each column non sortable
  return columns.map((it) => ({ ...it, enableSorting: false }));
}

function getXpColumns({
  friendsOnly,
  userOverride,
  addHeader,
}: {
  friendsOnly: boolean;
  userOverride?: Accessor<JSXElement>;
  addHeader?: boolean;
}): DataTableColumnDef<XpEntry>[] {
  const defineColumn = createColumnHelper<XpEntry>().accessor;
  const columns = [
    defineColumn("friendsRank", {
      header: () => <Fa icon="fa-user-friends" />,
      cell: (info) =>
        info.getValue() === 1 ? <Fa icon="fa-crown" /> : info.getValue(),
      meta: {
        align: "center",
        headerMeta: {
          "aria-label": "Friends rank",
          "data-balloon-pos": "down",
        },
      },
    }),
    defineColumn("rank", {
      header: () => <Fa icon={friendsOnly ? "fa-users" : "fa-hashtag"} />,
      cell: (info) =>
        info.getValue() === 1 ? <Fa icon="fa-crown" /> : info.getValue(),
      meta: {
        align: "center",
        headerMeta: {
          "aria-label": "Global rank",
          "data-balloon-pos": "down",
        },
      },
    }),
    defineColumn("uid", {
      header: "name",
      cell: (info) => userOverride?.() ?? <User user={info.row.original} />,
      meta: {
        cellMeta: () => ({ class: "w-full" }),
      },
    }),
    defineColumn("totalXp", {
      header: "xp gained",
      cell: (info) =>
        wrapWithHeader({
          value:
            info.getValue() < 1000
              ? info.getValue().toFixed(0)
              : abbreviateNumber(info.getValue()),
          header: "xp gained",
          enabled: addHeader,
        }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("timeTypedSeconds", {
      header: "time typed",
      cell: (info) =>
        wrapWithHeader({
          value: secondsToString(Math.round(info.getValue()), true, true, ":"),
          header: "time typed",
          enabled: addHeader,
        }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("totalXp", {
      id: "xpTimeTyped",
      header: () => (
        <>
          <div>xp gained</div>
          <div class="whitespace-nowrap opacity-50">time typed</div>
        </>
      ),
      cell: (info) => (
        <>
          <div>
            {info.getValue() < 1000
              ? info.getValue().toFixed(0)
              : abbreviateNumber(info.getValue())}
          </div>
          <div class="text-sub">
            {" "}
            {secondsToString(
              Math.round(info.row.original.timeTypedSeconds),
              true,
              true,
              ":",
            )}
          </div>
        </>
      ),
      meta: {
        align: "right",
        maxBreakpoint: "xl",
      },
    }),

    defineColumn("lastActivityTimestamp", {
      header: "date",
      cell: (info) =>
        info.getValue() !== undefined ? (
          addHeader ? (
            wrapWithHeader({
              value: dateFormat(info.getValue(), "dd MMM yyyy HH:mm"),
              header: "last activity",
              enabled: true,
            })
          ) : (
            <>
              <div>{dateFormat(info.getValue(), "dd MMM yyyy")}</div>
              <div class="text-sub">{dateFormat(info.getValue(), "HH:mm")}</div>
            </>
          )
        ) : (
          ""
        ),
      meta: {
        align: "right",
        cellMeta: (info) =>
          info.value !== undefined
            ? {
                "aria-label": formatDistanceToNow(info.value, {
                  addSuffix: true,
                }),
                "data-balloon-pos": "left",
              }
            : {},
      },
    }),
  ];

  //remove first column if not friendsOnly
  if (!friendsOnly) {
    columns.shift();
  }

  //mark each column as non sortable
  return columns.map((it) => ({
    ...it,
    enableSorting: false,
  }));
}

function wrapWithHeader(options: {
  value: string;
  header: string;
  enabled?: boolean;
}): string | JSXElement {
  return options.enabled ? (
    <>
      <div class="text-xs text-sub">{options.header}</div>
      <div>{options.value}</div>
    </>
  ) : (
    options.value
  );
}
