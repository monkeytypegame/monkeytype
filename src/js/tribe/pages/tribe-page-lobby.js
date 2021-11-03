import * as Tribe from "./tribe";
import * as Notifications from "./notifications";
import * as TribeChat from "./tribe-chat";
import * as CustomText from "./custom-text";
import * as TribeConfig from "./tribe-config";
import * as Commandline from "./commandline";
import * as CommandlineLists from "./commandline-lists";

export function reset() {
  $(".pageTribe .tribePage.lobby .userlist .list").empty();
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text("");
  $(".pageTribe .tribePage.lobby .inviteLink .link").text("");
  TribeChat.reset();
}

export function disableStartButton() {
  $(".pageTribe .tribePage.lobby .lobbyButtons .startTestButton").addClass(
    "disabled"
  );
}

export function enableStartButton() {
  $(".pageTribe .tribePage.lobby .lobbyButtons .startTestButton").removeClass(
    "disabled"
  );
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

export function updateRoomConfig() {
  if (Tribe.room == undefined) return;
  $(".pageTribe .tribePage.lobby .currentConfig .groups").empty();

  let room = Tribe.room;

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Mode" data-balloon-pos="up" commands="commandsMode">
    <i class="fas fa-bars"></i>${room.config.mode}
    </div>
    `);

  if (room.config.mode === "time") {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Time" data-balloon-pos="up" commands="commandsTimeConfig">
    <i class="fas fa-clock"></i>${room.config.mode2}
    </div>
    `);
  } else if (room.config.mode === "words") {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Words" data-balloon-pos="up" commands="commandsWordCount">
    <i class="fas fa-font"></i>${room.config.mode2}
    </div>
    `);
  } else if (room.config.mode === "quote") {
    let qstring = "all";
    let num = room.config.mode2;
    if (num == 0) {
      qstring = "short";
    } else if (num == 1) {
      qstring = "medium";
    } else if (num == 2) {
      qstring = "long";
    } else if (num == 3) {
      qstring = "thicc";
    }

    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Quote length" data-balloon-pos="up" commands="commandsQuoteLengthConfig">
    <i class="fas fa-quote-right"></i>${qstring}
    </div>
    `);
  } else if (room.config.mode === "custom") {
    let t = "Custom settings:";

    t += `\ntext length: ${CustomText.text.length}`;
    if (CustomText.isTimeRandom || CustomText.isWordRandom) {
      let r = "";
      let n = "";
      if (CustomText.isTimeRandom) {
        r = "time";
        n = CustomText.time;
      } else if (CustomText.isWordRandom) {
        r = "words";
        n = CustomText.word;
      }
      t += `\nrandom: ${r} ${n}`;
    }

    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="${t}" data-balloon-pos="up" data-balloon-break commands="commandsQuoteLengthConfig">
    <i class="fas fa-tools"></i>custom
    </div>
    `);
  }

  if (room.config.difficulty === "normal") {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="far fa-star"></i>normal
    </div>
    `);
  } else if (room.config.difficulty === "expert") {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="fas fa-star-half-alt"></i>expert
    </div>
    `);
  } else if (room.config.difficulty === "master") {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="fas fa-star"></i>master
    </div>
    `);
  }

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Language" data-balloon-pos="up" commands="commandsLanguages">
    <i class="fas fa-globe-americas"></i>${room.config.language}
    </div>
    `);

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Punctuation" data-balloon-pos="up" commands="commandsPunctuation">
    <span class="punc" style="font-weight: 900;
      color: var(--main-color);
      width: 1.25rem;
      text-align: center;
      display: inline-block;
      margin-right: .5rem;
      letter-spacing: -.1rem;">!?</span>${
        room.config.punctuation ? "on" : "off"
      }
    </div>
    `);

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Numbers" data-balloon-pos="up" commands="commandsNumbers">
    <span class="numbers" style="font-weight: 900;
        color: var(--main-color);
        width: 1.25rem;
        text-align: center;
        margin-right: .1rem;
        display: inline-block;
        margin-right: .5rem;
        letter-spacing: -.1rem;">15</span>${room.config.numbers ? "on" : "off"}
    </div>
    `);

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Funbox" data-balloon-pos="up" commands="commandsFunbox">
    <i class="fas fa-gamepad"></i>${room.config.funbox}
    </div>
    `);

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Lazy mode" data-balloon-pos="up" commands="commandsLazyMode">
    <i class="fas fa-couch"></i>${room.config.lazyMode ? "on" : "off"}
    </div>
    `);

  if (room.config.stopOnError === "off") {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="commandsStopOnError">
    <i class="fas fa-hand-paper"></i>off
    </div>
    `);
  } else {
    $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="commandsStopOnError">
    <i class="fas fa-hand-paper"></i>stop on ${room.config.stopOnError}
    </div>
    `);
  }

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Min Wpm" data-balloon-pos="up" commands="commandsMinWpm">
    <i class="fas fa-bomb"></i>${room.config.minWpm}${
    room.config.minWpm !== "off" ? "wpm" : ""
  }
    </div>
    `);

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Min Acc" data-balloon-pos="up" commands="commandsMinAcc">
    <i class="fas fa-bomb"></i>${room.config.minAcc}${
    room.config.minAcc !== "off" ? "wpm" : ""
  }
    </div>
    `);

  $(".pageTribe .tribePage.lobby .currentConfig .groups").append(`
    <div class='group' aria-label="Min Burst" data-balloon-pos="up" commands="commandsMinBurst">
    <i class="fas fa-bomb"></i>${room.config.minBurst}${
    room.config.minBurst !== "off" ? "wpm" : ""
  }
    </div>
    `);
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
  reset();
  let link = location.origin + "/tribe_" + Tribe.room.id;
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text(Tribe.room.id);
  $(".pageTribe .tribePage.lobby .inviteLink .link").text(link);
  updatePlayerList();
  updateButtons();
  updateVisibility();
  updateRoomName();
  updateRoomConfig();
  TribeConfig.apply(Tribe.room.config);
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

$(document).on(
  "click",
  ".pageTribe .tribePage.lobby .currentConfig .groups .group",
  (e) => {
    if (Tribe.room.users[Tribe.socket.id].isLeader) {
      // let commands = eval($(e.currentTarget).attr("commands"));
      let commands = CommandlineLists.getList(
        $(e.currentTarget).attr("commands")
      );
      if (commands != undefined) {
        if ($(e.currentTarget).attr("commands") === "commandsTags") {
          CommandlineLists.updateTagCommands();
        }
        CommandlineLists.pushCurrent(commands);
        Commandline.show();
      }
    }
  }
);
