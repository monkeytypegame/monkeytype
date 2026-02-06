import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Accessor, createMemo, JSXElement } from "solid-js";

import { createEffectOn } from "../../../hooks/effects";
import { getConfig } from "../../../signals/config";
import { getUserId } from "../../../signals/core";
import { secondsToString } from "../../../utils/date-and-time";
import { qs } from "../../../utils/dom";
import { Formatting } from "../../../utils/format";
import { abbreviateNumber } from "../../../utils/numbers";
import { Conditional } from "../../common/Conditional";
import { Fa } from "../../common/Fa";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";

export function Table(props: {
  type: "wpm" | "xp";
  entries: LeaderboardEntry[] | XpLeaderboardEntry[];
  friendsOnly: boolean;
  hideHeader?: true;
  scrollToUser: Accessor<boolean>;
  onScrolledToUser: () => void;
}): JSXElement {
  const commonProps = createMemo(() => ({
    id: "leaderboardTable",
    fallback: <div>no data found</div>,
    hideHeader: props.hideHeader,
    rowSelection: {
      getRowId: (row: { uid: string }) => row.uid,
      activeRow: getUserId,
      class: "text-main",
    },
  }));

  const wpmColumns = createMemo(() =>
    getWpmColumns({
      friendsOnly: props.friendsOnly,
      format: new Formatting(getConfig),
    }),
  );
  const xpColumns = createMemo(() => getXpColumns(props.friendsOnly));

  createEffectOn(props.scrollToUser, (enabled) => {
    if (enabled) {
      requestAnimationFrame(() => {
        qs("#leaderboardTable tr[data-state='selected']")?.scrollIntoView({
          block: "center",
        });
        props.onScrolledToUser();
      });
    }
  });

  return (
    <Conditional
      if={props.type === "wpm"}
      then={
        <DataTable
          {...commonProps()}
          columns={wpmColumns()}
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

function getWpmColumns({
  friendsOnly,
  format,
}: {
  friendsOnly: boolean;
  format: Formatting;
}): DataTableColumnDef<LeaderboardEntry>[] {
  const defineColumn = createColumnHelper<LeaderboardEntry>().accessor;
  const columns = [
    defineColumn("friendsRank", {
      header: () => (
        <span aria-label="friends rank" data-balloon-pos="down">
          <Fa icon="fa-user-friends" />
        </span>
      ),
      meta: {
        align: "center",
      },
    }),
    defineColumn("rank", {
      header: () => <Fa icon={friendsOnly ? "fa-users" : "fa-hashtag"} />,
      cell: (info) =>
        info.getValue() === 1 ? <Fa icon="fa-crown" /> : info.getValue(),
      meta: {
        align: "center",
      },
    }),
    defineColumn("uid", {
      header: "name",
      cell: (info) => <User user={info.row.original} />,
    }),
    defineColumn("wpm", {
      header: format.typingSpeedUnit,
      cell: (info) =>
        format.typingSpeed(info.getValue(), { showDecimalPlaces: true }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("acc", {
      header: "accuracy",
      cell: (info) =>
        format.percentage(info.getValue(), { showDecimalPlaces: true }),
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
          <div class="text-sub">accucacy</div>
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
        format.typingSpeed(info.getValue(), { showDecimalPlaces: true }),
      meta: {
        align: "right",
        breakpoint: "xl",
      },
    }),
    defineColumn("consistency", {
      header: "consistency",
      cell: (info) =>
        format.percentage(info.getValue(), { showDecimalPlaces: true }),
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
          <div class="text-sub">consistency</div>
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
          <>
            <div>{dateFormat(info.getValue(), "dd MMM yyyy")}</div>
            <div class="text-sub">{dateFormat(info.getValue(), "HH:mm")}</div>
          </>
        ) : (
          ""
        ),
      meta: {
        align: "right",
      },
    }),
  ];

  if (!friendsOnly) {
    columns.shift();
  }

  return columns.map((it) => ({ ...it, enableSorting: false }));
}

function getXpColumns(
  friendsOnly: boolean,
): DataTableColumnDef<XpLeaderboardEntry>[] {
  const defineColumn = createColumnHelper<XpLeaderboardEntry>().accessor;
  const columns = [
    defineColumn("friendsRank", {
      header: () => (
        <span aria-label="friends rank" data-balloon-pos="down">
          <Fa icon="fa-user-friends" />
        </span>
      ),
      meta: {
        align: "center",
      },
    }),
    defineColumn("rank", {
      header: () => <Fa icon={friendsOnly ? "fa-users" : "fa-hashtag"} />,
      cell: (info) =>
        info.getValue() === 1 ? <Fa icon="fa-crown" /> : info.getValue(),
      meta: {
        align: "center",
      },
    }),
    defineColumn("uid", {
      header: "name",
      cell: (info) => <User user={info.row.original} />,
    }),
    defineColumn("totalXp", {
      header: "wpm",
      cell: (info) =>
        info.getValue() < 1000
          ? info.getValue()
          : abbreviateNumber(info.getValue()),
      meta: {
        align: "right",
      },
    }),
    defineColumn("timeTypedSeconds", {
      header: "time typed",
      cell: (info) =>
        secondsToString(Math.round(info.getValue()), true, true, ":"),
      meta: {
        align: "right",
      },
    }),

    defineColumn("lastActivityTimestamp", {
      header: "date",
      cell: (info) =>
        info.getValue() !== undefined ? (
          <>
            <div>{dateFormat(info.getValue(), "dd MMM yyyy")}</div>
            <div class="text-sub">{dateFormat(info.getValue(), "HH:mm")}</div>
          </>
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

  if (!friendsOnly) {
    columns.unshift();
  }

  return columns.map((it) => ({
    ...it,
    enableSorting: false,
  }));
}
//placeholder
function User(props: { user: { name: string } }): JSXElement {
  return <div>{props.user.name}</div>;
}
