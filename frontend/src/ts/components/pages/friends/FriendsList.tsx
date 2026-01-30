import { PersonalBest } from "@monkeytype/schemas/shared";
import { Friend, UserNameSchema } from "@monkeytype/schemas/users";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { UseQueryResult } from "@tanstack/solid-query";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { JSXElement, Show } from "solid-js";

import Ape from "../../../ape";
import { formatAge, secondsToString } from "../../../utils/date-and-time";
import Format from "../../../utils/format";
import { getXpDetails } from "../../../utils/levels";
import { formatTypingStatsRatio } from "../../../utils/misc";
import { remoteValidation } from "../../../utils/remote-validation";
import { SimpleModal } from "../../../utils/simple-modal";
import { getLanguageDisplayString } from "../../../utils/strings";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { LoadingCircle } from "../../common/Loader";
import { User } from "../../common/User";
import { DataTable } from "../../ui/table/DataTable";
import { TableColumnHeader } from "../../ui/table/TableColumnHeader";

let onAdd: (receiverName: string) => Promise<void> | undefined;
let onDelete: (connectionId: string) => Promise<void> | undefined;

export function FriendsList(props: {
  data: UseQueryResult<Friend[]>;
  onAdd: (receiverName: string) => Promise<void>;
  onDelete: (uid: string) => Promise<void>;
}): JSXElement {
  onDelete = props.onDelete;
  onAdd = props.onAdd;

  return (
    <Show when={true}>
      <div class="items-bottom flex">
        <H2 text="Friends" fa={{ icon: "fa-user-friends", fixedWidth: true }} />
        <Show when={props.data.isRefetching}>
          <LoadingCircle />
        </Show>
        <Button
          fa={{ icon: "fa-plus", fixedWidth: true }}
          class="ml-auto"
          text="add friend"
          onClick={() => {
            addFriendModal.show(undefined, {});
          }}
        />
      </div>

      <AsyncContent
        query={props.data}
        alwaysShowContent={props.data.isRefetching}
      >
        {(data) => (
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

const addFriendModal = new SimpleModal({
  id: "addFriend",
  title: "Add a friend",
  inputs: [
    {
      placeholder: "user name",
      type: "text",
      initVal: "",
      validation: {
        schema: UserNameSchema,
        isValid: remoteValidation(
          async (name) => Ape.users.getNameAvailability({ params: { name } }),
          { check: (data) => !data.available || "Unknown user" },
        ),
        debounceDelay: 1000,
      },
    },
  ],
  buttonText: "request",
  onlineOnly: true,
  execFn: async (_thisPopup, receiverName) => {
    void (await onAdd(receiverName));

    return {
      showNotification: false,
      status: 1,
      message: "",
      alwaysHide: true,
    };
  },
});

const removeFriendModal = new SimpleModal({
  id: "confirmUnfriend",
  title: "Remove friend",
  buttonText: "remove friend",
  text: "Are you sure you want to remove as a friend?",
  beforeInitFn: (thisPopup) => {
    thisPopup.text = `Are you sure you want to remove ${thisPopup.parameters[1]} as a friend?`;
  },
  execFn: async (thisPopup) => {
    const connectionId = thisPopup.parameters[0] as string;
    void onDelete(connectionId);

    return {
      showNotification: false,
      status: 1,
      message: "",
      alwaysHide: true,
    };
  },
});

const defineColumn = createColumnHelper<Friend>().accessor;
const columns = [
  defineColumn("name", {
    header: (props) => <TableColumnHeader column={props.column} title="name" />,
    enableSorting: true,
    cell: (info) => <User user={info.row.original} />,
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
            removeFriendModal.show(
              [info.getValue() as string, info.row.original.name],
              {},
            );
          }}
          fa={{ icon: "fa-user-times", fixedWidth: true }}
        />
      ) : (
        ""
      ),
  }),
];

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
