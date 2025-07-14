import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { SimpleModal } from "../utils/simple-modal";
import Ape from "../ape";
import { formatDuration } from "date-fns/formatDuration";
import { intervalToDuration } from "date-fns";
import * as Notifications from "../elements/notifications";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import { getXpDetails } from "../utils/levels";
import { secondsToString } from "../utils/date-and-time";
import { PersonalBest } from "@monkeytype/contracts/schemas/shared";
import Format from "../utils/format";

const pageElement = $(".page.pageFriends");

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
        <td>${item.initiatorName}</td>
        <td>${formatAge(item.addedAt)}</td>
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

async function updateFriends(): Promise<void> {
  $(".pageFriends .friends .loading").removeClass("hidden");

  const result = await Ape.friends.getFriends();

  if (result.status !== 200) {
    $(".pageFriends .friends .error").removeClass("hidden");
    $(".pageFriends .friends .error p").html(result.body.message);
  } else {
    $(".pageFriends .friends .error").addClass("hidden");
    if (result.body.data.length === 0) {
      $(".pageFriends .friends table").addClass("hidden");
      $(".pageFriends .friends .nodata").removeClass("hidden");
    } else {
      $(".pageFriends .friends table").removeClass("hidden");
      $(".pageFriends .friends .nodata").addClass("hidden");

      const html = result.body.data
        .map((entry) => {
          let avatar = `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`;
          if (entry.discordAvatar !== undefined) {
            avatar = `<div class="avatarPlaceholder"><i class="fas fa-circle-notch fa-spin"></i></div>`;
          }
          const xpDetails = getXpDetails(entry.xp ?? 0);

          const top15 = formatPb(entry.top15);
          const top60 = formatPb(entry.top60);

          return `<tr data-id="${entry.friendRequestId}">
        <td>
          <div class="avatarNameBadge">
            <div class="lbav">${avatar}</div>
              <a href="${location.origin}/profile/${
            entry.uid
          }?isUid" class="entryName" uid=${entry.uid} router-link>${
            entry.name
          }</a>
            <div class="flagsAndBadge">
            ${
              isSafeNumber(entry.badgeId) ? getBadgeHTMLbyId(entry.badgeId) : ""
            }
            </div>
          </div>
        </td>
        <td>${formatAge(entry.addedAt)}</td>
        <td>${xpDetails.level}</td>
        <td>${entry.completedTests}/${entry.startedTests}</td>
        <td>${secondsToString(
          Math.round(entry.timeTyping ?? 0),
          true,
          true
        )}</td>
        <td>${entry.streak !== undefined ? entry.streak.length + " days" : ""}
        <td>${top15?.wpm}</td>
        <td>${top60?.wpm}</td>
        <td class="actions">
          <button class="actions" aria-label="actions" data-balloon-pos="top">
            <i class="fas fa-ellipsis-v fa-fw"></i>
          </button> 
        </td>
      </tr>`;
        })
        .join("\n");

      $(".pageFriends .friends tbody").html(html);
    }
  }

  $(".pageFriends .friends .loading").addClass("hidden");
}

function formatAge(timestamp?: number): string {
  if (timestamp === undefined) return "";
  const formatted = formatDuration(
    intervalToDuration({ start: timestamp, end: Date.now() }),
    { format: ["days", "hours", "minutes"] }
  );
  return (formatted !== "" ? formatted : "less then a minute") + " ago";
}

function formatPb(entry?: PersonalBest):
  | {
      wpm: string;
      acc: string;
      raw: string;
      con: string;
    }
  | undefined {
  if (entry === undefined) {
    return undefined;
  }
  return {
    wpm: Format.typingSpeed(entry.wpm, { showDecimalPlaces: true }),
    acc: Format.percentage(entry.acc, { showDecimalPlaces: true }),
    raw: Format.typingSpeed(entry.raw, { showDecimalPlaces: true }),
    con: Format.percentage(entry.consistency, { showDecimalPlaces: true }),
  };
}

$("#friendAdd").on("click", () => {
  addFriendModal.show(undefined, {});
});

$(".pageFriends .pendingRequests button.refresh").on("click", async () => {
  void updatePendingRequests();
});

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
    await updateFriends();
  },
});

$(() => {
  Skeleton.save("pageFriends");
});
