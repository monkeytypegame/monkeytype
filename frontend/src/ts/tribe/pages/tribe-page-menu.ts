import tribeSocket from "../tribe-socket";
import { getTribeConfig } from "../tribe-config";

export const queues = [false, false, false, false];

export function disableButtons(): void {
  $(".pageTribe .menu .matchmaking .buttons button").addClass("disabled");
  $(".pageTribe .menu .customRooms button").addClass("disabled");
  $(".pageTribe .menu .customRooms .customInput").addClass("disabled");
}

export function enableButtons(): void {
  $(".pageTribe .menu .matchmaking .buttons button").removeClass("disabled");
  $(".pageTribe .menu .customRooms button").removeClass("disabled");
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
  const buttons = $(".pageTribe .menu .matchmaking .buttons button");

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

$(".pageTribe .menu .customRooms #createCustomRoom").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  disableButtons();
  tribeSocket.out.room.create(getTribeConfig());
});

$(".pageTribe .menu .devRoom").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  tribeSocket.out.dev?.room();
});

$(".pageTribe .menu .matchmaking .buttons button").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  const queue = $(e.currentTarget).attr("queue") as string;
  toggleQueue(parseInt(queue));
  refreshQueueButtons();
});
