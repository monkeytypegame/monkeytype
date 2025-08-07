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
import { Friend } from "@monkeytype/schemas/friends";
import { SortedTable } from "../utils/sorted-table";
import { getAvatarElement } from "../utils/discord-avatar";
import { formatTypingStatsRatio } from "../utils/misc";
import { getLanguageDisplayString } from "../utils/strings";

const pageElement = $(".page.pageFriends");

let friendsTable: SortedTable<Friend> | undefined = undefined;

const addFriendModal = new SimpleModal({
  id: "addFriend",
  title: "Add a friend",
  inputs: [{ placeholder: "user name", type: "text", initVal: "" }],
  buttonText: "request",
  onlineOnly: true,
  execFn: async (_thisPopup, friendName) => {
    const result = await Ape.friends.createRequest({ body: { friendName } });

    if (result.status !== 200) {
      return {
        status: -1,
        message: `Friend request failed: ${result.body.message}`,
      };
    } else {
      return { status: 1, message: `Request send to ${friendName}` };
    }
  },
});

async function updatePendingRequests(): Promise<void> {
  $(".pageFriends .pendingRequests .loading").removeClass("hidden");
  $(".pageFriends .pendingRequests .nodata").addClass("hidden");

  const result = await Ape.friends.getRequests({
    query: { status: "pending", type: "incoming" },
  });

  if (result.status !== 200) {
    $(".pageFriends .pendingRequests .error").removeClass("hidden");
    $(".pageFriends .pendingRequests .error p").html(result.body.message);
  } else {
    $(".pageFriends .pendingRequests .error").addClass("hidden");
    if (result.body.data.length === 0) {
      $(".pageFriends .pendingRequests table").addClass("hidden");
      $(".pageFriends .pendingRequests .nodata").removeClass("hidden");
    } else {
      $(".pageFriends .pendingRequests table").removeClass("hidden");
      $(".pageFriends .pendingRequests .nodata").addClass("hidden");
      const html = result.body.data
        .map(
          (item) => `<tr data-id="${item._id}">
        <td> <a href="${location.origin}/profile/${
            item.initiatorUid
          }?isUid" router-link>${item.initiatorName}</a></td>
        <td>${formatAge(item.addedAt)} ago</td>
        <td class="actions">
          <button class="accepted" aria-label="accept friend" data-balloon-pos="top">
            <i class="fas fa-check fa-fw"></i>
          </button> 
          <button class="rejected" aria-label="reject friend" data-balloon-pos="top">
            <i class="fas fa-times fa-fw"></i>
          </button> 
          <button class="blocked" aria-label="block user from sending friend requests" data-balloon-pos="top">
            <i class="fas fa-shield-alt fa-fw"></i>
          </button>
        </td>
      </tr>`
        )
        .join("\n");

      $(".pageFriends .pendingRequests tbody").html(html);
    }
  }

  $(".pageFriends .pendingRequests .loading").addClass("hidden");
}

async function fetchFriends(): Promise<void> {
  $(".pageFriends .friends .loading").removeClass("hidden");
  const result = await Ape.friends.getFriends();
  $(".pageFriends .friends .loading").addClass("hidden");

  if (result.status !== 200) {
    $(".pageFriends .friends .error").removeClass("hidden");
    $(".pageFriends .friends .error p").html(result.body.message);
    return;
  }

  $(".pageFriends .friends .error").addClass("hidden");

  if (result.body.data.length === 0) {
    $(".pageFriends .friends table").addClass("hidden");
    $(".pageFriends .friends .nodata").removeClass("hidden");
  } else {
    $(".pageFriends .friends table").removeClass("hidden");
    $(".pageFriends .friends .nodata").addClass("hidden");

    if (friendsTable === undefined) {
      friendsTable = new SortedTable<Friend>({
        table: ".pageFriends .friends table",
        data: result.body.data,
        buildRow: buildFriendRow,
        initialSort: { property: "name", descending: false },
      });
    } else {
      friendsTable.setData(result.body.data);
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
  element.dataset["id"] = entry.friendRequestId;
  element.innerHTML = `<tr data-id="${entry.friendRequestId}">
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
        <td>${formatAge(entry.addedAt, "short")}</td>
        <td aria-label="total xp: ${
          isSafeNumber(entry.xp) ? formatXp(entry.xp) : ""
        }" data-balloon-pos="top">
          ${xpDetails.level}
        </td>
        <td aria-label="${testStats.completedPercentage}% (${
    testStats.restartRatio
  } restarts per completed test)" data-balloon-pos="top">${
    entry.completedTests
  }/${entry.startedTests}</td>
        <td>${secondsToString(
          Math.round(entry.timeTyping ?? 0),
          true,
          true
        )}</td>
        <td aria-label="${formatStreak(
          entry.streak?.maxLength,
          "max streak"
        )}" data-balloon-pos="top">
          ${formatStreak(entry.streak?.length)} 
        </td>
        <td aria-label="${
          top15?.details
        }" data-balloon-pos="top" data-balloon-break="">${
    top15?.wpm
  }<div class="sub">${top15?.acc}</div></td>
        <td aria-label="${
          top60?.details
        }" data-balloon-pos="top" data-balloon-break="">${
    top60?.wpm
  }<div class="sub">${top60?.acc}</div></td>
        <td class="actions">
            <button class="rejected" aria-label="reject friend" data-balloon-pos="top">
            <i class="fas fa-user-times fa-fw"></i>
          </button> 
          <button class="blocked" aria-label="block user from sending friend requests" data-balloon-pos="top">
            <i class="fas fa-user-shield fa-fw"></i>
          </button>
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
  return isSafeNumber(length)
    ? `${prefix !== undefined ? prefix + " " : ""}${length} ${
        length === 1 ? "day" : "days"
      } `
    : "";
}

$("#friendAdd").on("click", () => {
  addFriendModal.show(undefined, {});
});

$(".pageFriends .pendingRequests button.refresh").on("click", async () => {
  void updatePendingRequests();
});

// need to set the listener for action buttons on the table because the table content is getting replaced
$(".pageFriends .pendingRequests table").on("click", async (e) => {
  const action = Array.from(e.target.classList).find((it) =>
    ["accepted", "rejected", "blocked"].includes(it)
  );

  if (action === undefined) return;

  const id = e.target.parentElement?.parentElement?.dataset["id"];
  if (id === undefined) {
    throw new Error("Cannot find id of target.");
  }

  if (action === "rejected") {
    const result = await Ape.friends.deleteRequest({
      params: { id },
    });

    if (result.status !== 200) {
      Notifications.add(
        `Cannot reject friend request: ${result.body.message}`,
        -1
      );
    } else {
      e.target.parentElement?.parentElement?.remove();
    }
  } else {
    const result = await Ape.friends.updateRequest({
      params: { id },
      body: { status: action as "accepted" | "blocked" },
    });

    if (result.status !== 200) {
      Notifications.add(
        `Cannot update friend request: ${result.body.message}`,
        -1
      );
    } else {
      e.target.parentElement?.parentElement?.remove();
    }
  }
});

export const page = new Page<undefined>({
  id: "friends",
  display: "Friends",
  element: pageElement,
  path: "/friends",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageFriends");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageFriends", "main");

    await updatePendingRequests();
    await fetchFriends();
  },
});

$(() => {
  Skeleton.save("pageFriends");
});
