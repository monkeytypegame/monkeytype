import * as Tribe from "./tribe";
import * as Notifications from "./notifications";
import * as TribeChat from "./tribe-chat";

export function reset() {
  $(".pageTribe .tribePage.lobby .userlist .list").empty();
  TribeChat.reset();
}

export function updateButtons() {
  if (Tribe.room.users[Tribe.socket.id].isLeader) {
    $(".pageTribe .tribePage.lobby .lobbyButtons .startTestButton").removeClass(
      "hidden"
    );
    $(".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton").addClass(
      "hidden"
    );
  } else {
    $(".pageTribe .tribePage.lobby .lobbyButtons .startTestButton").addClass(
      "hidden"
    );
    $(".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton").removeClass(
      "hidden"
    );
  }
}

export function updateVisibility() {
  if (Tribe.room.users[Tribe.socket.id].isLeader) {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .icon-button"
    ).removeClass("hidden");
  } else {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .icon-button"
    ).addClass("hidden");
  }
  if (Tribe.room.isPrivate) {
    $(".pageTribe .tribePage.lobby .visibilityAndName .visibility .text").text(
      "private"
    );
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .icon-button"
    ).html(`<i class="fa fa-fw fa-lock"></i>`);
  } else {
    $(".pageTribe .tribePage.lobby .visibilityAndName .visibility .text").text(
      "public"
    );
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .visibility .icon-button"
    ).html(`<i class="fa fa-fw fa-lock-open"></i>`);
  }
}

export function updateRoomName() {
  if (Tribe.room.users[Tribe.socket.id].isLeader) {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .roomName .icon-button"
    ).removeClass("hidden");
  } else {
    $(
      ".pageTribe .tribePage.lobby .visibilityAndName .roomName .icon-button"
    ).addClass("hidden");
  }
  $(".pageTribe .tribePage.lobby .visibilityAndName .roomName .text").text(
    Tribe.room.name
  );
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

export function init() {
  let link = location.origin + "/tribe_" + Tribe.room.id;
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text(Tribe.room.id);
  $(".pageTribe .tribePage.lobby .inviteLink .link").text(link);
  updatePlayerList();
  updateButtons();
  updateVisibility();
  updateRoomName();
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

$(
  ".pageTribe .tribePage.lobby .visibilityAndName .visibility .icon-button"
).click((e) => {
  Tribe.socket.emit("room_toggle_visibility");
});

$(
  ".pageTribe .tribePage.lobby .visibilityAndName .roomName .icon-button"
).click((e) => {
  //TODO proper popup
  let name = prompt("Enter new room name");
  Tribe.socket.emit("room_update_name", { name });
});
