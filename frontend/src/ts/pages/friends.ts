import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { SimpleModal } from "../utils/simple-modal";
import Ape from "../ape";
import {
  intervalToDuration,
  format as dateFormat,
  formatDuration,
  DurationUnit,
} from "date-fns";
import * as Notifications from "../elements/notifications";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import { formatXp, getXpDetails } from "../utils/levels";
import { secondsToString } from "../utils/date-and-time";
import { PersonalBest } from "@monkeytype/schemas/shared";
import Format from "../utils/format";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import { SortedTable } from "../utils/sorted-table";
import { getAvatarElement } from "../utils/discord-avatar";
import { formatTypingStatsRatio } from "../utils/misc";
import { getLanguageDisplayString } from "../utils/strings";
import * as DB from "../db";
import { getAuthenticatedUser } from "../firebase";
import * as ServerConfiguration from "../ape/server-configuration";
import * as AuthEvent from "../observables/auth-event";
import { Connection } from "@monkeytype/schemas/connections";
import { Friend } from "@monkeytype/schemas/users";

const pageElement = $(".page.pageFriends");

let friendsTable: SortedTable<Friend> | undefined = undefined;

let pendingRequests: Connection[] | undefined;
let friendsList: Friend[] | undefined;

export function getFriendUid(
  connection: Pick<Connection, "initiatorUid" | "friendUid">
): string {
  const me = getAuthenticatedUser();
  if (me === null)
    throw new Error("expected to be authenticated in getFriendUid");

  if (me.uid === connection.initiatorUid) return connection.friendUid;
  return connection.initiatorUid;
}

export async function addFriend(friendName: string): Promise<true | string> {
  const result = await Ape.connections.create({ body: { friendName } });

  if (result.status !== 200) {
    return `Friend request failed: ${result.body.message}`;
  } else {
    const snapshot = DB.getSnapshot();
    if (snapshot !== undefined) {
      const friendUid = getFriendUid(result.body.data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      snapshot.connections[friendUid] = result.body.data.status;
      updatePendingConnections();
    }
    return true;
  }
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
        isValid: async (name: string) => {
          const checkNameResponse = await Ape.users.getNameAvailability({
            params: { name: name },
          });

          return (
            (checkNameResponse.status === 200 &&
              !checkNameResponse.body.data.available) ||
            "Unknown user"
          );
        },
        debounceDelay: 1000,
      },
    },
  ],
  buttonText: "request",
  onlineOnly: true,
  execFn: async (_thisPopup, friendName) => {
    const result = await addFriend(friendName);

    if (result !== true) {
      return {
        status: -1,
        message: result,
      };
    } else {
      return { status: 1, message: `Request send to ${friendName}` };
    }
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
    const result = await Ape.connections.delete({
      params: { id: connectionId },
    });
    if (result.status !== 200) {
      return { status: -1, message: result.body.message };
    } else {
      friendsList = friendsList?.filter(
        (it) => it.connectionId !== connectionId
      );
      friendsTable?.setData(friendsList ?? []);
      friendsTable?.updateBody();
      return { status: 1, message: `Removed friend.` };
    }
  },
});

async function fetchPendingConnections(): Promise<void> {
  const result = await Ape.connections.get({
    query: { status: "pending", type: "incoming" },
  });

  if (result.status !== 200) {
    Notifications.add("Error getting connections: " + result.body.message, -1);
    pendingRequests = undefined;
  } else {
    pendingRequests = result.body.data;
    DB.updateConnections(pendingRequests);
  }
}

function updatePendingConnections(): void {
  $(".pageFriends .pendingRequests").addClass("hidden");

  if (pendingRequests === undefined || pendingRequests.length === 0) {
    $(".pageFriends .pendingRequests").addClass("hidden");
  } else {
    $(".pageFriends .pendingRequests").removeClass("hidden");

    const html = pendingRequests
      .map(
        (item) => `<tr data-id="${item._id}" data-friend-uid="${getFriendUid(
          item
        )}">
        <td><a href="${location.origin}/profile/${
          item.initiatorUid
        }?isUid" router-link>${item.initiatorName}</a></td>
        <td>${formatAge(item.addedAt)} ago</td>
        <td class="actions">
          <button class="accepted" aria-label="accept" data-balloon-pos="up">
            <i class="fas fa-check fa-fw"></i>
          </button> 
          <button class="rejected" aria-label="reject" data-balloon-pos="up">
            <i class="fas fa-times fa-fw"></i>
          </button> 
          <button class="blocked" aria-label="block" data-balloon-pos="up">
            <i class="fas fa-shield-alt fa-fw"></i>
          </button>
        </td>
      </tr>`
      )
      .join("\n");

    $(".pageFriends .pendingRequests tbody").html(html);
  }
}

async function fetchFriends(): Promise<void> {
  const result = await Ape.users.getFriends();
  if (result.status !== 200) {
    Notifications.add("Error getting friends: " + result.body.message, -1);
    friendsList = undefined;
  } else {
    friendsList = result.body.data;
  }
}

function updateFriends(): void {
  $(".pageFriends .friends .nodata").addClass("hidden");
  $(".pageFriends .friends table").addClass("hidden");

  $(".pageFriends .friends .error").addClass("hidden");

  if (friendsList === undefined || friendsList.length === 0) {
    $(".pageFriends .friends table").addClass("hidden");
    $(".pageFriends .friends .nodata").removeClass("hidden");
  } else {
    $(".pageFriends .friends table").removeClass("hidden");
    $(".pageFriends .friends .nodata").addClass("hidden");

    if (friendsTable === undefined) {
      friendsTable = new SortedTable<Friend>({
        table: ".pageFriends .friends table",
        data: friendsList,
        buildRow: buildFriendRow,
        initialSort: { property: "name", descending: false },
      });
    } else {
      friendsTable.setData(friendsList);
    }
    friendsTable.updateBody();
  }
}

function buildFriendRow(entry: Friend): HTMLTableRowElement {
  const xpDetails = getXpDetails(entry.xp ?? 0);
  const testStats = formatTypingStatsRatio(entry);

  const top15 = formatPb(entry.top15);
  const top60 = formatPb(entry.top60);

  const element = document.createElement("tr");
  element.dataset["connectionId"] = entry.connectionId;

  const isMe = entry.uid === getAuthenticatedUser()?.uid;

  let actions = "";
  if (isMe) {
    element.classList.add("me");
  } else {
    actions = `<button class="remove">
            <i class="fas fa-user-times fa-fw"></i>
          </button>`;
  }
  element.innerHTML = `<tr>
        <td>
          <div class="avatarNameBadge">
            <div class="avatarPlaceholder"></div>
              <a href="${location.origin}/profile/${
    entry.uid
  }?isUid" class="entryName" uid=${entry.uid} router-link>${
    entry.name
  }</a>            <div class="flagsAndBadge">
            ${getHtmlByUserFlags(entry)}
              ${
                isSafeNumber(entry.badgeId)
                  ? getBadgeHTMLbyId(entry.badgeId)
                  : ""
              }
            </div>
          </div>
        </td>
        <td>${
          entry.addedAt !== undefined ? formatAge(entry.addedAt, "short") : "-"
        }</td>
        <td><span aria-label="total xp: ${
          isSafeNumber(entry.xp) ? formatXp(entry.xp) : ""
        }" data-balloon-pos="up">
          ${xpDetails.level}
        </span></td>
        <td><span aria-label="${testStats.completedPercentage}% (${
    testStats.restartRatio
  } restarts per completed test)" data-balloon-pos="up">${
    entry.completedTests
  }/${entry.startedTests}</span></td>
        <td>${secondsToString(
          Math.round(entry.timeTyping ?? 0),
          true,
          true
        )}</td>
        <td><span aria-label="${formatStreak(
          entry.streak?.maxLength,
          "max streak"
        )}" data-balloon-pos="up">
          ${formatStreak(entry.streak?.length)} 
        </span></td>
        <td class="small"><span aria-label="${
          top15?.details
        }" data-balloon-pos="up" data-balloon-break="">${
    top15?.wpm ?? "-"
  }<div class="sub">${top15?.acc ?? "-"}</div><span></td>
        <td class="small"><span aria-label="${
          top60?.details
        }" data-balloon-pos="up" data-balloon-break="">${
    top60?.wpm ?? "-"
  }<div class="sub">${top60?.acc ?? "-"}</div></span></td>
  <td class="actions">
  ${actions}
            
        </td>
      </tr>`;

  element
    .querySelector(".avatarPlaceholder")
    ?.replaceWith(getAvatarElement(entry));
  return element;
}

function formatAge(
  timestamp: number | undefined,
  format?: "short" | "full"
): string {
  const units: Array<DurationUnit> = [
    "years",
    "months",
    "days",
    "hours",
    "minutes",
  ];

  if (timestamp === undefined) return "";
  let formatted = "";
  const duration = intervalToDuration({ start: timestamp, end: Date.now() });

  if (format === undefined || format === "full") {
    formatted = formatDuration(duration, { format: units });
  } else {
    for (const unit of units) {
      const value = duration[unit];
      if (value !== undefined && value > 0) {
        formatted = `${value} ${unit}`;
        break;
      }
    }
  }

  return formatted !== "" ? formatted : "less then a minute";
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

  result.details = [
    `${getLanguageDisplayString(entry.language)}`,
    `${result.wpm} wpm`,
    `${result.raw} raw`,
    `${result.acc} acc`,
    `${result.con} con`,
    `${dateFormat(entry.timestamp, "dd MMM yyyy")}`,
  ].join("\n");

  return result;
}

function formatStreak(length?: number, prefix?: string): string {
  if (length === 1) return "-";
  return isSafeNumber(length)
    ? `${prefix !== undefined ? prefix + " " : ""}${length} days`
    : "-";
}

$(".pageFriends button.friendAdd").on("click", () => {
  addFriendModal.show(undefined, {});
});

// need to set the listener for action buttons on the table because the table content is getting replaced
$(".pageFriends .pendingRequests table").on("click", async (e) => {
  const action = Array.from(e.target.classList).find((it) =>
    ["accepted", "rejected", "blocked"].includes(it)
  ) as "accepted" | "rejected" | "blocked";

  if (action === undefined) return;

  const row = e.target.closest("tr") as HTMLElement;
  const id = row.dataset["id"];
  if (id === undefined) {
    throw new Error("Cannot find id of target.");
  }
  row.querySelectorAll("button").forEach((button) => (button.disabled = true));

  const result =
    action === "rejected"
      ? await Ape.connections.delete({
          params: { id },
        })
      : await Ape.connections.update({
          params: { id },
          body: { status: action },
        });

  if (result.status !== 200) {
    Notifications.add(
      `Cannot update friend request: ${result.body.message}`,
      -1
    );
  } else {
    //remove from cache
    pendingRequests = pendingRequests?.filter((it) => it._id !== id);
    updatePendingConnections();

    const snapshot = DB.getSnapshot();
    if (snapshot) {
      const friendUid = row.dataset["friendUid"];
      if (friendUid === undefined) {
        throw new Error("Cannot find friendUid of target.");
      }

      if (action === "rejected") {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-unsafe-member-access
        delete snapshot.connections[friendUid];
      } else {
        snapshot.connections[friendUid] = action;
      }
      DB.setSnapshot(snapshot);
    }
    if (action === "accepted") {
      await fetchFriends();
      updateFriends();
    }
  }
});
// need to set the listener for action buttons on the table because the table content is getting replaced
$(".pageFriends .friends table").on("click", async (e) => {
  const action = Array.from(e.target.classList).find((it) =>
    ["remove"].includes(it)
  );

  if (action === undefined) return;

  const row = e.target.closest("tr") as HTMLElement;
  const connectionId = row.dataset["connectionId"];
  if (connectionId === undefined) {
    throw new Error("Cannot find id of target.");
  }

  if (action === "remove") {
    const name = row.querySelector("a.entryName")?.textContent ?? "";

    removeFriendModal.show([connectionId, name], {});
  }
});

function showSpinner(): void {
  document.querySelector(".friends .spinner")?.classList.remove("hidden");
}

function hideSpinner(): void {
  document.querySelector(".friends .spinner")?.classList.add("hidden");
}

function update(): void {
  updatePendingConnections();
  updateFriends();
}

export const page = new Page<undefined>({
  id: "friends",
  display: "Friends",
  element: pageElement,
  path: "/friends",
  loadingOptions: {
    loadingMode: () => {
      if (!getAuthenticatedUser()) {
        return "none";
      }
      const hasCache =
        friendsList !== undefined && pendingRequests !== undefined;

      if (hasCache) {
        return {
          mode: "async",
          beforeLoading: showSpinner,
          afterLoading: () => {
            hideSpinner();
            update();
          },
        };
      } else {
        return "sync";
      }
    },

    loadingPromise: async () => {
      await ServerConfiguration.configurationPromise;
      const serverConfig = ServerConfiguration.get();
      if (!serverConfig?.connections.enabled) {
        throw new Error("Connectins are disabled.");
      }

      await Promise.all([fetchPendingConnections(), fetchFriends()]);
    },
    style: "bar",
    keyframes: [
      { percentage: 50, durationMs: 1500, text: "Downloading friends..." },
      {
        percentage: 50,
        durationMs: 1500,
        text: "Downloading friend requests...",
      },
    ],
  },

  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageFriends");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageFriends", "main");
    update();
  },
});

$(() => {
  Skeleton.save("pageFriends");
});

AuthEvent.subscribe((event) => {
  if (event.type === "authStateChanged" && !event.data.isUserSignedIn) {
    pendingRequests = undefined;
    friendsList = undefined;
  }
});
