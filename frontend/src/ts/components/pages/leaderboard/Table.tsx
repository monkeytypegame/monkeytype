import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Accessor, createMemo, JSXElement } from "solid-js";

import { getConfig } from "../../../config/store";
import { isFriend } from "../../../db";
import { createEffectOn } from "../../../hooks/effects";
import { bp, BreakpointKey } from "../../../states/breakpoints";
import { getUserId } from "../../../states/core";
import { cn } from "../../../utils/cn";
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
    class: cn(
      "table-auto [&>tbody>tr>td]:py-3 [&>tbody>tr>td]:whitespace-nowrap [&>thead>tr>th]:align-middle",
      "[&>tbody>tr>td]:px-2 [&>tbody>tr>td]:text-[0.75em] [&>thead>tr>th]:px-2 [&>thead>tr>th]:text-[0.75em]",
      "xs:[&>tbody>tr>td]:px-2 xs:[&>tbody>tr>td]:text-[0.8em] xs:[&>thead>tr>th]:px-2 xs:[&>thead>tr>th]:text-[0.8em]",
      "sm:[&>tbody>tr>td]:px-4 sm:[&>tbody>tr>td]:text-[1em] sm:[&>thead>tr>th]:px-4 sm:[&>thead>tr>th]:text-[1em]",
      "xl:[&>tbody>tr>td]:px-6 xl:[&>thead>tr>th]:px-6",
    ),
    rowSelection:
      props.userOverride !== undefined
        ? undefined
        : {
            getRowId: (row: { uid: string }) => row.uid,
            activeRow: getUserId,
            class: cn(
              "text-main [&>td>div]:text-main [&>td>div>a]:text-main",
              "**:data-[ui-element='button']:[--themable-button-text:var(--text-main)]",
            ),
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
          noDataRow={{
            content: <NoEntriesFound />,
          }}
        />
      }
      else={
        <DataTable
          {...commonProps()}
          columns={xpColumns()}
          data={props.entries as XpLeaderboardEntry[]}
          noDataRow={{
            content: <NoEntriesFound />,
          }}
        />
      }
    />
  );
}

function NoEntriesFound(): JSXElement {
  return (
    <div class="flex flex-row items-center justify-center rounded bg-sub-alt p-4 text-text">
      <div>No entries found ¯\_(ツ)_/¯</div>
    </div>
  );
}

const friendsRankColumn = () =>
  createColumnHelper<SpeedEntry | XpEntry>().accessor("friendsRank", {
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
  });

const rankColumn = (friendsOnly: boolean) =>
  createColumnHelper<SpeedEntry | XpEntry>().accessor("rank", {
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
  });

const userColumn = ({
  userOverride,
}: {
  userOverride?: Accessor<JSXElement>;
}) =>
  createColumnHelper<SpeedEntry | XpEntry>().accessor("uid", {
    header: "name",
    cell: (info) =>
      userOverride?.() ?? (
        <User
          avatarFallback="user-circle"
          avatarColor="sub"
          flagsColor="sub"
          user={info.row.original}
          isFriend={isFriend(info.row.original.uid)}
          class="w-min text-[1em] **:data-[ui-element='button']:[--themable-button-text:var(--text-color)]"
          linkToProfile={true}
        />
      ),
    meta: {
      cellMeta: () => ({ class: "w-full" }),
    },
  });

function defineResponsivePair<T>() {
  return <KA extends string & keyof T, KB extends string & keyof T>({
    columns,
    switchBreakpoint: breakpoint,
    addHeader,
    mergedMeta,
    subtitleClass = "text-em-xs opacity-50 sm:text-em-base",
  }: {
    columns: [
      { path: KA; header: string; format: (value: T[KA]) => string },
      { path: KB; header: string; format: (value: T[KB]) => string },
    ];
    switchBreakpoint: BreakpointKey;
    addHeader?: boolean;
    mergedMeta?: { breakpoint?: BreakpointKey };
    subtitleClass?: string;
  }): DataTableColumnDef<T>[] => {
    const [a, b] = columns;

    return [
      {
        id: a.path,
        accessorFn: (row: T) => row[a.path],
        header: a.header,
        cell: (info: { getValue: () => T[KA] }) =>
          wrapWithHeader({
            value: a.format(info.getValue()),
            header: a.header,
            enabled: addHeader,
          }),
        meta: { align: "right" as const, breakpoint },
      },
      {
        id: b.path,
        accessorFn: (row: T) => row[b.path],
        header: b.header,
        cell: (info: { getValue: () => T[KB] }) =>
          wrapWithHeader({
            value: b.format(info.getValue()),
            header: b.header,
            enabled: addHeader,
          }),
        meta: { align: "right" as const, breakpoint },
      },
      {
        id: a.path + b.path.charAt(0).toUpperCase() + b.path.slice(1),
        accessorFn: (row: T) => row[a.path],
        header: () => (
          <>
            <div>{a.header}</div>
            <div class={subtitleClass}>{b.header}</div>
          </>
        ),
        cell: (info: { getValue: () => T[KA]; row: { original: T } }) => (
          <>
            <div>{a.format(info.getValue())}</div>
            <div class="text-sub">{b.format(info.row.original[b.path])}</div>
          </>
        ),
        meta: {
          align: "right" as const,
          maxBreakpoint: breakpoint,
          ...mergedMeta,
        },
      },
    ];
  };
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
    friendsRankColumn() as DataTableColumnDef<SpeedEntry>,
    rankColumn(friendsOnly) as DataTableColumnDef<SpeedEntry>,
    userColumn({ userOverride }) as DataTableColumnDef<SpeedEntry>,
    ...defineResponsivePair<SpeedEntry>()({
      columns: [
        {
          path: "wpm",
          header: format.typingSpeedUnit,
          format: (v) => format.typingSpeed(v, { showDecimalPlaces: true }),
        },
        {
          path: "acc",
          header: "accuracy",
          format: (v) => format.percentage(v, { showDecimalPlaces: true }),
        },
      ],
      switchBreakpoint: "xl",
      addHeader,
    }),
    ...defineResponsivePair<SpeedEntry>()({
      columns: [
        {
          path: "raw",
          header: "raw",
          format: (v) => format.typingSpeed(v, { showDecimalPlaces: true }),
        },
        {
          path: "consistency",
          header: "consistency",
          format: (v) => format.percentage(v, { showDecimalPlaces: true }),
        },
      ],
      switchBreakpoint: "xl",
      addHeader,
      mergedMeta: { breakpoint: "xs" },
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
            <div class="text-em-sm">
              <div>{dateFormat(info.getValue(), "dd MMM yyyy")}</div>
              <div class="text-sub">{dateFormat(info.getValue(), "HH:mm")}</div>
            </div>
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
    friendsRankColumn() as DataTableColumnDef<XpEntry>,
    rankColumn(friendsOnly) as DataTableColumnDef<XpEntry>,
    userColumn({ userOverride }) as DataTableColumnDef<XpEntry>,
    ...defineResponsivePair<XpEntry>()({
      columns: [
        {
          path: "totalXp",
          header: "xp gained",
          format: (v) => (v < 1000 ? v.toFixed(0) : abbreviateNumber(v)),
        },
        {
          path: "timeTypedSeconds",
          header: "time typed",
          format: (v) => secondsToString(Math.round(v), true, true, ":"),
        },
      ],
      switchBreakpoint: "xl",
      addHeader,
      subtitleClass: "whitespace-nowrap opacity-50",
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
