import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

export function init() {
  let link = location.origin + "/tribe_" + Tribe.room.id;
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text(Tribe.room.id);
  $(".pageTribe .tribePage.lobby .inviteLink .link").text(link);
  updatePlayerList();
}

export function updatePlayerList() {
  $(".pageTribe .tribePage.lobby .userlist .list").empty();
  let usersArray = [];
  Object.keys(Tribe.room.users).forEach((userId) => {
    usersArray.push(Tribe.room.users[userId]);
  });
  let sortedUsers = usersArray.sort((a, b) => b.points - a.points);
  sortedUsers.forEach((user) => {
    let icons = "";
    if (user.isLeader) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-star"></i></div>`;
    } else {
      icons += `<div class="icon ${
        user.isReady ? "active" : ""
      }"><i class="fas fa-fw fa-check"></i></div>`;
    }
    icons += `<div class="icon ${
      user.isTyping ? "active" : ""
    }"><i class="fas fa-fw fa-keyboard"></i></div>`;
    let pointsString;
    if (user.points == undefined) {
      pointsString = "";
    } else {
      pointsString = user.points + (user.points == 1 ? "pt" : "pts");
    }
    $(".pageTribe .lobby .userlist .list").append(`
    <div class='user ${user.id === Tribe.socket.id ? "me" : ""}'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        Tribe.room.isLeader && user.id !== Tribe.socket.id
          ? `<div class='userSettings' id='` +
            user.id +
            `' aria-label="User settings" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `);
    $(".pageTest #result .tribeResultChat .userlist .list").append(`
    <div class='user ${user.id === Tribe.socket.id ? "me" : ""}'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        Tribe.room.isLeader && user.id !== Tribe.socket.id
          ? `<div class='userSettings' id='` +
            user.id +
            `' aria-label="User settings" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `);
  });
}

$(".pageTribe .tribePage.lobby .inviteLink .text").hover(
  function () {
    $(this).css(
      "color",
      "#" + $(".pageTribe .tribePage.lobby .inviteLink .text").text()
    );
  },
  function () {
    $(this).css("color", "");
  }
);

$(".pageTribe .tribePage.lobby .lobbyButtons .leaveRoomButton").click((e) => {
  Tribe.socket.emit("room_leave");
});

$(".pageTribe .tribePage.lobby .inviteLink .text").click(async (e) => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .tribePage.lobby .inviteLink .text").text()
    );
    Notifications.add("Code copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTribe .tribePage.lobby .inviteLink .link").click(async (e) => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .tribePage.lobby .inviteLink .link").text()
    );
    Notifications.add("Link copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});
