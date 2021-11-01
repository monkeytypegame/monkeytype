import * as Notifications from "./notifications";

export let queues = [false, false, false, false];

export function disableLobbyButtons() {
  $(".pageTribe .prelobby .matchmaking .buttons .button").addClass("disabled");
  $(".pageTribe .prelobby .customRooms .button").addClass("disabled");
  $(".pageTribe .prelobby .customRooms .customInput").addClass("disabled");
}

export function enableLobbyButtons() {
  $(".pageTribe .prelobby .matchmaking .buttons .button").removeClass(
    "disabled"
  );
  $(".pageTribe .prelobby .customRooms .button").removeClass("disabled");
  $(".pageTribe .prelobby .customRooms .customInput").removeClass("disabled");
}

export function showLeaveQueueButton() {
  $(".pageTribe .prelobby .matchmaking .leaveMatchmakingButton").removeClass(
    "hidden"
  );
}

export function hideLeaveQueueButton() {
  $(".pageTribe .prelobby .matchmaking .leaveMatchmakingButton").addClass(
    "hidden"
  );
}

export function showStartQueueButton() {
  $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").removeClass(
    "hidden"
  );
}

export function hideStartQueueButton() {
  $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").addClass(
    "hidden"
  );
}

function toggleQueue(queue) {
  queues[queue] = !queues[queue];
}

function refreshQueueButtons() {
  let buttons = $(".pageTribe .prelobby .matchmaking .buttons .button");

  buttons.removeClass("active");

  let atleastone = false;
  queues.forEach((queue, id) => {
    if (queue) {
      atleastone = true;
      $(buttons[id]).addClass("active");
    }
  });
  if (!atleastone) {
    $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").addClass(
      "disabled"
    );
    $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").html(
      `<i class="fas fa-times"></i>
      Select at least one queue`
    );
  } else {
    $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").removeClass(
      "disabled"
    );
    $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").html(
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
  // $(".pageTribe .prelobby #joinByCode input").val("");

  // $(".pageTribe .prelobby #joinByCode .customInput").html(`
  //   <span class="byte">--</span>
  //   /
  //   <span class="byte">--</span>
  //   /
  //   <span class="byte">--</span>
  // `);
}

$(".pageTribe .prelobby .matchmaking .buttons .button").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  let queue = $(e.currentTarget).attr("queue");
  toggleQueue(queue);
  refreshQueueButtons();
});

$(".pageTribe .prelobby #joinByCode .customInput").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  $(".pageTribe .prelobby #joinByCode input").focus();
});

$(".pageTribe .prelobby #joinByCode input").focus((e) => {
  $(".pageTribe .prelobby #joinByCode .customInput .byte").addClass("focused");
});

$(".pageTribe .prelobby #joinByCode input").focusout((e) => {
  $(".pageTribe .prelobby #joinByCode .customInput .byte").removeClass(
    "focused"
  );
});

$(".pageTribe .prelobby #joinByCode .button").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  let code = $(".pageTribe .prelobby #joinByCode input").val().toLowerCase();
  if (code.length !== 6) {
    Notifications.add("Code required", 0);
  } else {
    joinRoomByCode(code);
  }
});

$(".pageTribe .prelobby #joinByCode input").keyup((e) => {
  if (e.key === "Enter") {
    let code = $(".pageTribe .prelobby #joinByCode input").val().toLowerCase();
    if (code.length !== 6) {
      Notifications.add("Code required", 0);
    } else {
      joinRoomByCode(code);
    }
  }
});

$(".pageTribe .prelobby #joinByCode input").keydown((e) => {
  if (!/[0-9a-fA-F]/.test(e.key)) {
    e.preventDefault();
  } else {
    setTimeout((t) => {
      // let t1 = "xx";
      // let t2 = "xx";
      // let t2 = "xx";
      let v = $(".pageTribe .prelobby #joinByCode input").val();
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
      $($(".pageTribe .prelobby #joinByCode .customInput .byte")[0]).text(
        text.substring(0, 2)
      );
      $($(".pageTribe .prelobby #joinByCode .customInput .byte")[1]).text(
        text.substring(2, 4)
      );
      $($(".pageTribe .prelobby #joinByCode .customInput .byte")[2]).text(
        text.substring(4, 6)
      );
    }, 0);
  }
});
