import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { SimpleModal } from "../utils/simple-modal";
import Ape from "../ape";
import {
  intervalToDuration,
  format as dateFormat,
  formatDuration,
  formatDistanceToNow,
  format,
} from "date-fns";
import * as Notifications from "../elements/notifications";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import { formatXp, getXpDetails } from "../utils/levels";
import { secondsToString } from "../utils/date-and-time";
import { PersonalBest } from "@monkeytype/schemas/shared";
import Format from "../utils/format";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import { SortedTable, SortSchema } from "../utils/sorted-table";
import { getAvatarElement } from "../utils/discord-avatar";
import { formatTypingStatsRatio } from "../utils/misc";
import { getLanguageDisplayString } from "../utils/strings";
import * as DB from "../db";
import { getAuthenticatedUser } from "../firebase";
import * as ServerConfiguration from "../ape/server-configuration";
import * as AuthEvent from "../observables/auth-event";
import { Connection } from "@monkeytype/schemas/connections";
import { Friend, UserNameSchema } from "@monkeytype/schemas/users";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { remoteValidation } from "../utils/remote-validation";
import { qs, qsr, onDOMReady } from "../utils/dom";

let friendsTable: SortedTable<Friend> | undefined = undefined;

let pendingRequests: Connection[] | undefined;
let friendsList: Friend[] | undefined;

export function getReceiverUid(
  connection: Pick<Connection, "initiatorUid" | "receiverUid">,
): string {
  const me = getAuthenticatedUser();
  if (me === null) {
    throw new Error("expected to be authenticated in getReceiverUid");
  }

  if (me.uid === connection.initiatorUid) return connection.receiverUid;
  return connection.initiatorUid;
}

export async function addFriend(receiverName: string): Promise<true | string> {
  const result = await Ape.connections.create({ body: { receiverName } });

  if (result.status !== 200) {
    return `Friend request failed: ${result.body.message}`;
  } else {
    const snapshot = DB.getSnapshot();
    if (snapshot !== undefined) {
      const receiverUid = getReceiverUid(result.body.data);
      // oxlint-disable-next-line no-unsafe-member-access
      snapshot.connections[receiverUid] = result.body.data.status;
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
  execFn: async (_thisPopup, receiverName) => {
    const result = await addFriend(receiverName);

    if (result === true) {
      return { status: 1, message: `Request sent to ${receiverName}` };
    }

    let status: -1 | 0 | 1 = -1;
    let message: string = "Unknown error";

    if (result.includes("already exists")) {
      status = 0;
      message = `You are already friends with ${receiverName}`;
    } else if (result.includes("request already sent")) {
      status = 0;
      message = `You have already sent a friend request to ${receiverName}`;
    } else if (result.includes("blocked by initiator")) {
      status = 0;
      message = `You have blocked ${receiverName}`;
    } else if (result.includes("blocked by receiver")) {
      status = 0;
      message = `${receiverName} has blocked you`;
    }

    return { status, message, alwaysHide: true };
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
        (it) => it.connectionId !== connectionId,
      );
      friendsTable?.setData(friendsList ?? []);
      friendsTable?.updateBody();
      return { status: 1, message: `Friend removed` };
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
    DB.mergeConnections(pendingRequests);
  }
}

function updatePendingConnections(): void {
  qs(".pageFriends .pendingRequests")?.hide();

  if (pendingRequests === undefined || pendingRequests.length === 0) {
    qs(".pageFriends .pendingRequests")?.hide();
  } else {
    qs(".pageFriends .pendingRequests")?.show();

    const html = pendingRequests
      .map(
        (item) => `<tr data-id="${
          item._id
        }" data-receiver-uid="${getReceiverUid(item)}">
        <td><a href="${location.origin}/profile/${
          item.initiatorUid
        }?isUid" router-link>${item.initiatorName}</a></td>
        <td>
          <span data-balloon-pos="up" aria-label="since ${format(
            item.lastModified,
            "dd MMM yyyy HH:mm",
          )}">
            ${formatAge(item.lastModified)} ago
          <span>
        </td>
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
      </tr>`,
      )
      .join("\n");

    qs(".pageFriends .pendingRequests tbody")?.setHtml(html);
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
  qs(".pageFriends .friends .nodata")?.hide();
  qs(".pageFriends .friends table")?.hide();

  qs(".pageFriends .friends .error")?.hide();

  if (friendsList === undefined || friendsList.length === 0) {
    qs(".pageFriends .friends table")?.hide();
    qs(".pageFriends .friends .nodata")?.show();
  } else {
    qs(".pageFriends .friends table")?.show();
    qs(".pageFriends .friends .nodata")?.hide();

    if (friendsTable === undefined) {
      friendsTable = new SortedTable<Friend>({
        table: qsr(".pageFriends .friends table"),
        data: friendsList,
        buildRow: buildFriendRow,
        persistence: new LocalStorageWithSchema({
          key: "friendsListSort",
          schema: SortSchema,
          fallback: { property: "name", descending: false },
        }),
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
        <td><span data-balloon-pos="up" aria-label="${
          entry.lastModified !== undefined
            ? "since " + format(entry.lastModified, "dd MMM yyyy HH:mm")
            : ""
        }">${
          entry.lastModified !== undefined
            ? formatAge(entry.lastModified, "short")
            : "-"
        }</span></td>
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
          true,
        )}</td>
        <td><span aria-label="${formatStreak(
          entry.streak?.maxLength,
          "longest streak",
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

function formatStreak(length?: number, prefix?: string): string {
  if (length === 1) return "-";
  return isSafeNumber(length)
    ? `${prefix !== undefined ? prefix + " " : ""}${length} days`
    : "-";
}

qs(".pageFriends button.friendAdd")?.on("click", () => {
  addFriendModal.show(undefined, {});
});

// need to set the listener for action buttons on the table because the table content is getting replaced
qs(".pageFriends .pendingRequests table")?.on("click", async (e) => {
  const target = e.target as HTMLElement;
  const action = Array.from(target.classList).find((it) =>
    ["accepted", "rejected", "blocked"].includes(it),
  ) as "accepted" | "rejected" | "blocked";

  if (action === undefined) return;

  const row = target.closest("tr") as HTMLElement;
  const id = row.dataset["id"];
  if (id === undefined) {
    throw new Error("Cannot find id of target.");
  }
  row.querySelectorAll("button").forEach((button) => (button.disabled = true));

  showLoaderBar();
  const result =
    action === "rejected"
      ? await Ape.connections.delete({
          params: { id },
        })
      : await Ape.connections.update({
          params: { id },
          body: { status: action },
        });
  hideLoaderBar();

  if (result.status !== 200) {
    Notifications.add(
      `Cannot update friend request: ${result.body.message}`,
      -1,
    );
  } else {
    //remove from cache
    pendingRequests = pendingRequests?.filter((it) => it._id !== id);
    updatePendingConnections();

    const snapshot = DB.getSnapshot();
    if (snapshot) {
      const receiverUid = row.dataset["receiverUid"];
      if (receiverUid === undefined) {
        throw new Error("Cannot find receiverUid of target.");
      }

      if (action === "rejected") {
        // oxlint-disable-next-line no-dynamic-delete, no-unsafe-member-access
        delete snapshot.connections[receiverUid];
      } else {
        snapshot.connections[receiverUid] = action;
      }
      DB.setSnapshot(snapshot);
    }

    if (action === "blocked") {
      Notifications.add(`User has been blocked`, 0);
    }
    if (action === "accepted") {
      Notifications.add(`Request accepted`, 1);
    }
    if (action === "rejected") {
      Notifications.add(`Request rejected`, 0);
    }

    if (action === "accepted") {
      showSpinner();
      await fetchFriends();
      updateFriends();
      hideSpinner();
    }
  }
});
// need to set the listener for action buttons on the table because the table content is getting replaced
qs(".pageFriends .friends table")?.on("click", async (e) => {
  const target = e.target as HTMLElement;
  const action = Array.from(target.classList).find((it) =>
    ["remove"].includes(it),
  );

  if (action === undefined) return;

  const row = target.closest("tr") as HTMLElement;
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
  element: qsr(".page.pageFriends"),
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

onDOMReady(() => {
  Skeleton.save("pageFriends");
});

AuthEvent.subscribe((event) => {
  if (event.type === "authStateChanged" && !event.data.isUserSignedIn) {
    pendingRequests = undefined;
    friendsList = undefined;
  }
});
