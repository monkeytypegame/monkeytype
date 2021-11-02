import * as Notifications from "./notifications";
import * as Tribe from "./tribe";

export let queues = [false, false, false, false];

export function disableButtons() {
  $(".pageTribe .menu .matchmaking .buttons .button").addClass("disabled");
  $(".pageTribe .menu .customRooms .button").addClass("disabled");
  $(".pageTribe .menu .customRooms .customInput").addClass("disabled");
}

export function enableButtons() {
  $(".pageTribe .menu .matchmaking .buttons .button").removeClass("disabled");
  $(".pageTribe .menu .customRooms .button").removeClass("disabled");
  $(".pageTribe .menu .customRooms .customInput").removeClass("disabled");
}

export function showLeaveQueueButton() {
  $(".pageTribe .menu .matchmaking .leaveMatchmakingButton").removeClass(
    "hidden"
  );
}

export function hideLeaveQueueButton() {
  $(".pageTribe .menu .matchmaking .leaveMatchmakingButton").addClass("hidden");
}

export function showStartQueueButton() {
  $(".pageTribe .menu .matchmaking .startMatchmakingButton").removeClass(
    "hidden"
  );
}

export function hideStartQueueButton() {
  $(".pageTribe .menu .matchmaking .startMatchmakingButton").addClass("hidden");
}

function toggleQueue(queue) {
  queues[queue] = !queues[queue];
}

function refreshQueueButtons() {
  let buttons = $(".pageTribe .menu .matchmaking .buttons .button");

  buttons.removeClass("active");

  let atleastone = false;
  queues.forEach((queue, id) => {
    if (queue) {
      atleastone = true;
      $(buttons[id]).addClass("active");
    }
  });
  if (!atleastone) {
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").addClass(
      "disabled"
    );
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").html(
      `<i class="fas fa-times"></i>
      Select at least one queue`
    );
  } else {
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").removeClass(
      "disabled"
    );
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").html(
      `<i class="fas fa-search"></i>
      Search`
    );
  }
}

export function getQ() {
  let ret = [];
  queues.forEach((queue, id) => {
    if (queue) {
      ret.push(id);
    }
  });
  return ret;
}

export function joinRoomByCode(code) {
  Notifications.add("todo", -1);
  return;
  // code = "room_" + code;
  // socket.emit("mp_room_join", { roomId: code });
  // $(".pageTribe .menu #joinByCode input").val("");

  // $(".pageTribe .menu #joinByCode .customInput").html(`
  //   <span class="byte">--</span>
  //   /
  //   <span class="byte">--</span>
  //   /
  //   <span class="byte">--</span>
  // `);
}

$(".pageTribe .menu .customRooms #createCustomRoom").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  disableButtons();
  Tribe.socket.emit("room_create");
});

$(".pageTribe .menu .matchmaking .buttons .button").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  let queue = $(e.currentTarget).attr("queue");
  toggleQueue(queue);
  refreshQueueButtons();
});

$(".pageTribe .menu #joinByCode .customInput").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  $(".pageTribe .menu #joinByCode input").focus();
});

$(".pageTribe .menu #joinByCode input").focus((e) => {
  $(".pageTribe .menu #joinByCode .customInput .byte").addClass("focused");
});

$(".pageTribe .menu #joinByCode input").focusout((e) => {
  $(".pageTribe .menu #joinByCode .customInput .byte").removeClass("focused");
});

$(".pageTribe .menu #joinByCode .button").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  let code = $(".pageTribe .menu #joinByCode input").val().toLowerCase();
  if (code.length !== 6) {
    Notifications.add("Code required", 0);
  } else {
    joinRoomByCode(code);
  }
});

$(".pageTribe .menu #joinByCode input").keyup((e) => {
  if (e.key === "Enter") {
    let code = $(".pageTribe .menu #joinByCode input").val().toLowerCase();
    if (code.length !== 6) {
      Notifications.add("Code required", 0);
    } else {
      joinRoomByCode(code);
    }
  }
});

$(".pageTribe .menu #joinByCode input").keydown((e) => {
  if (!/[0-9a-fA-F]/.test(e.key)) {
    e.preventDefault();
  } else {
    setTimeout(() => {
      // let t1 = "xx";
      // let t2 = "xx";
      // let t2 = "xx";
      let v = $(".pageTribe .menu #joinByCode input").val();
      // let text = `${v[0] == undefined ? 'x' : v[0]}`;
      // let iv = 0;
      // for (let i = 0; i < 8; i++){
      //   text[i] = v[iv] == undefined ? 'x' : v[iv];
      //   if(![2,5].includes(i)) iv++;
      // }
      let code = [];
      for (let i = 0; i < 6; i++) {
        let char = v[i] == undefined ? "-" : v[i];
        code.push(char);
      }
      let text = code.join("");
      $($(".pageTribe .menu #joinByCode .customInput .byte")[0]).text(
        text.substring(0, 2)
      );
      $($(".pageTribe .menu #joinByCode .customInput .byte")[1]).text(
        text.substring(2, 4)
      );
      $($(".pageTribe .menu #joinByCode .customInput .byte")[2]).text(
        text.substring(4, 6)
      );
    }, 0);
  }
});
