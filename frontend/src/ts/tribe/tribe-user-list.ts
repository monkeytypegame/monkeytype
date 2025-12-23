import * as TribeState from "./tribe-state";
import * as TribeUserSettingsPopup from "../popups/tribe-user-settings-popup";
import tribeSocket from "./tribe-socket";
import { User } from "./types";
import { getAvatarElement } from "../utils/discord-avatar";

export function reset(page?: string): void {
  if (page === undefined) {
    $(".pageTribe .tribePage.lobby .userlist .list").empty();
    $(".pageTest #result #tribeResultBottom .userlist .list").empty();
  } else if (page === "lobby") {
    $(".pageTribe .tribePage.lobby .userlist .list").empty();
  } else if (page === "result") {
    $(".pageTest #result #tribeResultBottom .userlist .list").empty();
  }
}

export function update(page?: string): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (page === undefined) {
    update("lobby");
    update("result");
    return;
  }
  reset(page);
  const usersArray = [];

  for (const userId of Object.keys(room.users)) {
    usersArray.push(room.users[userId]);
  }
  const sortedUsers = usersArray.sort(
    (a, b) => (b?.points ?? 0) - (a?.points ?? 0),
  ) as User[];
  sortedUsers.forEach((user) => {
    let icons = "";
    if (user.isTyping && !user.isFinished) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-keyboard"></i></div>`;
    } else if (user.isAfk) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-mug-hot"></i></div>`;
    } else if (user.isLeader) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-star"></i></div>`;
    } else {
      icons += `<div class="icon ${
        user.isReady ? "active" : ""
      }"><i class="fas fa-fw fa-check"></i></div>`;
    }
    let pointsString;
    if (user.points === undefined) {
      pointsString = "";
    } else {
      pointsString = user.points + (user.points === 1 ? "pt" : "pts");
    }
    const appendData = `
    <div class='user ${user.id === tribeSocket.getId() ? "me" : ""} ${
      user.isAfk ? "afk" : ""
    }'>
    <div class="nameAndIcons">
      <div class='avatar'>
      ${
        getAvatarElement({
          discordId: undefined,
          discordAvatar: undefined,
        }).innerHTML
      }
      </div>
      <div class='name'>
      ${user.name}
      </div>
      <div class='icons'>
      ${icons}
      </div>
      ${
        TribeState.getSelf()?.isLeader && user.id !== tribeSocket.getId()
          ? `<div class='userSettings' userid='` +
            user.id +
            `' ><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `;
    if (page === "lobby") {
      $(".pageTribe .lobby .userlist .list").append(appendData);
    } else if (page === "result") {
      $(".pageTest #result #tribeResultBottom .userlist .list").append(
        appendData,
      );
    }
  });
}

$(document).on(
  "click",
  ".pageTribe .lobby .userlist .list .user .userSettings, .pageTest #result #tribeResultBottom .userlist .list .user .userSettings",
  (e) => {
    const userId = $(e.currentTarget).attr("userid") as string;
    TribeUserSettingsPopup.show(userId);
  },
);
