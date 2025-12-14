import * as Notifications from "../../elements/notifications";
import Config from "../../config";
import tribeSocket from "../tribe-socket";

export const queues = [false, false, false, false];

export function disableButtons(): void {
  $(".pageTribe .menu .matchmaking .buttons .button").addClass("disabled");
  $(".pageTribe .menu .customRooms .button").addClass("disabled");
  $(".pageTribe .menu .customRooms .customInput").addClass("disabled");
}

export function enableButtons(): void {
  $(".pageTribe .menu .matchmaking .buttons .button").removeClass("disabled");
  $(".pageTribe .menu .customRooms .button").removeClass("disabled");
  $(".pageTribe .menu .customRooms .customInput").removeClass("disabled");
}

export function showLeaveQueueButton(): void {
  $(".pageTribe .menu .matchmaking .leaveMatchmakingButton").removeClass(
    "hidden",
  );
}

export function hideLeaveQueueButton(): void {
  $(".pageTribe .menu .matchmaking .leaveMatchmakingButton").addClass("hidden");
}

export function showStartQueueButton(): void {
  $(".pageTribe .menu .matchmaking .startMatchmakingButton").removeClass(
    "hidden",
  );
}

export function hideStartQueueButton(): void {
  $(".pageTribe .menu .matchmaking .startMatchmakingButton").addClass("hidden");
}

function toggleQueue(queue: number): void {
  queues[queue] = !queues[queue];
}

function refreshQueueButtons(): void {
  const buttons = $(".pageTribe .menu .matchmaking .buttons .button");

  buttons.removeClass("active");

  let atleastone = false;
  queues.forEach((queue, id) => {
    if (queue) {
      atleastone = true;
      $(buttons[id] as HTMLElement).addClass("active");
    }
  });
  if (!atleastone) {
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").addClass(
      "disabled",
    );
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").html(
      `<i class="fas fa-times"></i>
      Select at least one queue`,
    );
  } else {
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").removeClass(
      "disabled",
    );
    $(".pageTribe .menu .matchmaking .startMatchmakingButton").html(
      `<i class="fas fa-search"></i>
      Search`,
    );
  }
}

export function getQ(): number[] {
  const ret: number[] = [];
  queues.forEach((queue, id) => {
    if (queue) {
      ret.push(id);
    }
  });
  return ret;
}

export function joinRoomByCode(_code: string): void {
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

$(".pageTribe .menu .customRooms #createCustomRoom").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  disableButtons();
  let mode2;
  if (Config.mode === "time") {
    mode2 = Config.time;
  } else if (Config.mode === "words") {
    mode2 = Config.words;
  } else if (Config.mode === "quote") {
    mode2 = Config.quoteLength ?? "-1";
  } else if (Config.mode === "custom") {
    mode2 = "custom";
  } else {
    mode2 = "zen";
  }
  tribeSocket.out.room.create(Config.mode, mode2);
});

$(".pageTribe .menu .devRoom").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  tribeSocket.out.dev?.room();
});

$(".pageTribe .menu .matchmaking .buttons .button").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  const queue = $(e.currentTarget).attr("queue") as string;
  toggleQueue(parseInt(queue));
  refreshQueueButtons();
});
