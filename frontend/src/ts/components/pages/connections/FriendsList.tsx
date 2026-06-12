import { PersonalBest } from "@monkeytype/schemas/shared";
import { Friend, UserNameSchema } from "@monkeytype/schemas/users";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { useQuery } from "@tanstack/solid-query";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createMemo, Show } from "solid-js";
import { z } from "zod";

import Ape from "../../../ape";
import {
  addConnection,
  findConnectionToUser,
  rejectConnection,
} from "../../../collections/connections";
import { getFriendsListQuery } from "../../../queries/friends";
import { getActivePage, getFormatting } from "../../../states/core";
import { showSimpleModal } from "../../../states/simple-modal";
import { getSnapshot } from "../../../states/snapshot";
import { formatAge, secondsToString } from "../../../utils/date-and-time";
import { Formatting } from "../../../utils/format";
import { formatXp, getXpDetails } from "../../../utils/levels";
import { formatTypingStatsRatio } from "../../../utils/misc";
import { remoteValidation } from "../../../utils/remote-validation";
import { getLanguageDisplayString } from "../../../utils/strings";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { LoadingCircle } from "../../common/LoadingCircle";
import { User } from "../../common/User";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";

export function FriendsList() {
  const isOpen = () => getActivePage() === "friends";

  const query = useQuery(() => ({
    ...getFriendsListQuery(),
    enabled: isOpen(),
  }));

  const columns = createMemo(() => {
    return getColumns({ format: getFormatting() });
  });

  return (
    <div>
      <div class="items-bottom flex">
        <H2 text="Friends" fa={{ icon: "fa-user-friends", fixedWidth: true }} />
        <Show when={query.isRefetching}>
          <LoadingCircle />
        </Show>
        <Button
          fa={{ icon: "fa-plus", fixedWidth: true }}
          class="ml-auto"
          text="add friend"
          onClick={() =>
            showSimpleModal({
              title: "Add a friend",
              schema: z.object({ receiverName: UserNameSchema }),
              inputs: {
                receiverName: {
                  placeholder: "user name",
                  type: "text",
                  initVal: "",

                  validation: {
                    isValid: async (name: string) => {
                      if (name === getSnapshot()?.name) {
                        return "That is not how you make friends.";
                      }

                      const existingConnection = findConnectionToUser(name);

                      if (existingConnection?.status === "blocked") {
                        return existingConnection.receiverName === name
                          ? `${name} has blocked you from sending friend requests.`
                          : `You have blocked ${name}. Unblock them to sent a friend request in the account settings.`;
                      }
                      if (existingConnection?.status === "pending") {
                        return `You have already sent a friend request to ${name}`;
                      }
                      if (existingConnection?.status === "accepted") {
                        return `You are already friends with ${name}`;
                      }

                      return remoteValidation(
                        async (name: string) =>
                          Ape.users.getNameAvailability({ params: { name } }),
                        { check: (data) => !data.available || "Unknown user" },
                      )(name);
                    },
                    debounceDelay: 1000,
                  },
                },
              },
              buttonText: "request",
              execFn: async ({ receiverName }) => {
                await addConnection({ receiverName });

                return {
                  showNotification: false,
                  status: "success",
                };
              },
            })
          }
        />
      </div>
      <AsyncContent queries={{ query }}>
        {({ queryData }) => (
          <DataTable
            id="friendsList"
            columns={columns()}
            data={queryData()}
            bodyCellClass="text-xs sm:text-sm xl:text-base"
            fallback={
              <div class="text-center text-sub">
                You don&lsquo;t have any friends :(
              </div>
            }
          />
        )}
      </AsyncContent>
    </div>
  );
}

function getColumns({
  format,
}: {
  format: Formatting;
}): DataTableColumnDef<Friend>[] {
  const defineColumn = createColumnHelper<Friend>().accessor;
  const cols = [
    defineColumn("name", {
      enableSorting: true,
      cell: (info) => (
        <User
          avatarFallback="user-circle"
          avatarColor="sub"
          flagsColor="sub"
          user={info.row.original}
          isFriend={false}
          class="w-min **:data-[ui-element='button']:[--themable-button-text:var(--text-color)]"
          linkToProfile
        />
      ),
    }),
    defineColumn("lastModified", {
      enableSorting: true,
      header: "friends for",
      cell: ({ getValue }) =>
        getValue() === undefined ? "-" : formatAge(getValue(), "short"),
      meta: {
        cellMeta: ({ value }) =>
          value === undefined
            ? {}
            : {
                "data-balloon-pos": "up",
                "aria-label": `since ${dateFormat(value, "dd MMM yyy HH:mm")}`,
              },
      },
    }),
    defineColumn("xp", {
      header: "level",
      enableSorting: true,
      cell: ({ getValue }) => getXpDetails(getValue() ?? 0).level,
      meta: {
        cellMeta: ({ value }) =>
          value === undefined
            ? {}
            : {
                "data-balloon-pos": "up",
                "aria-label": `total xp: ${formatXp(value)}`,
              },
      },
    }),
    defineColumn("completedTests", {
      enableSorting: true,
      header: "tests",
      cell: (info) => `${info.getValue()}/${info.row.original.startedTests}`,
      meta: {
        breakpoint: "lg",
        cellMeta: ({ row }) => {
          const testStats = formatTypingStatsRatio(row);

          return {
            "data-balloon-pos": "up",
            "aria-label": `${testStats.completedPercentage}% (${
              testStats.restartRatio
            } restarts per completed test)`,
          };
        },
      },
    }),
    defineColumn("timeTyping", {
      header: "time typing",
      enableSorting: true,
      cell: ({ getValue }) =>
        secondsToString(Math.round(getValue() ?? 0), true, true),
      meta: {
        breakpoint: "sm",
      },
    }),

    defineColumn("streak.length", {
      header: "streak",
      enableSorting: true,
      cell: ({ getValue }) => formatStreak(getValue()),
      meta: {
        breakpoint: "sm",
        cellMeta: ({ row }) => {
          const value = row.streak.maxLength as number | undefined;
          return value === undefined
            ? {}
            : {
                "data-balloon-pos": "up",
                "aria-label": formatStreak(value, "longest streak"),
              };
        },
      },
    }),

    defineColumn("top15.wpm", {
      header: "time 15 pb",

      enableSorting: true,
      cell: (info) => {
        const pb = formatPb(info.row.original.top15, { format });
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
          class: "text-xs sm:text-xs md:text-xs xl:text-sm",
          "data-balloon-pos": "up",
          "data-balloon-break": "",
          "aria-label": formatPb(row.top15 as PersonalBest, { format })
            ?.details,
        }),
      },
    }),
    defineColumn("top60.wpm", {
      header: "time 60 pb",
      enableSorting: true,
      cell: (info) => {
        const pb = formatPb(info.row.original.top60, { format });
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
          class: "text-xs sm:text-xs md:text-xs xl:text-sm",
          "data-balloon-pos": "up",
          "data-balloon-break": "",
          "aria-label": formatPb(row.top60, { format })?.details,
        }),
      },
    }),

    defineColumn("connectionId", {
      header: "",
      cell: (info) =>
        //check the row is our own user
        info.getValue() !== undefined ? (
          <Button
            onClick={() =>
              showSimpleModal({
                title: `remove user ${info.row.original.name}?`,
                buttonText: "remove friend",
                execFn: async () => {
                  await rejectConnection({ id: info.getValue() as string });
                  return {
                    status: "success",
                    message: `User ${info.row.original.name} removed`,
                  };
                },
              })
            }
            balloon={{ text: "remove friend" }}
            fa={{ icon: "fa-user-times", fixedWidth: true }}
          />
        ) : (
          ""
        ),
    }),
  ];

  return cols;
}

function formatStreak(length?: number, prefix?: string): string {
  if (length === 1) return "-";
  return isSafeNumber(length)
    ? `${prefix !== undefined ? `${prefix} ` : ""}${length} days`
    : "-";
}

function formatPb(
  entry: PersonalBest | undefined,
  options: { format: Formatting },
):
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
    wpm: options.format.typingSpeed(entry.wpm, { showDecimalPlaces: true }),
    acc: options.format.percentage(entry.acc, { showDecimalPlaces: true }),
    raw: options.format.typingSpeed(entry.raw, { showDecimalPlaces: true }),
    con: options.format.percentage(entry.consistency, {
      showDecimalPlaces: true,
    }),
    details: "",
  };

  const details = [
    `${getLanguageDisplayString(entry.language)}`,
    `${result.wpm} ${options.format.typingSpeedUnit}`,
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
