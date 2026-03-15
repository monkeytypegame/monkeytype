import tribeSocket from "../tribe-socket";
import { getTribeConfig } from "../tribe-config";
import { qs, qsa } from "../../utils/dom";

export const queues = [false, false, false, false];

export function disableButtons(): void {
  qsa(".pageTribe .menu .matchmaking .buttons button")?.disable();
  qsa(".pageTribe .menu .customRooms button")?.disable();
  qsa(".pageTribe .menu .customRooms .customInput")?.addClass("disabled");
}

export function enableButtons(): void {
  qsa(".pageTribe .menu .matchmaking .buttons button")?.enable();
  qsa(".pageTribe .menu .customRooms button")?.enable();
  qsa(".pageTribe .menu .customRooms .customInput")?.removeClass("disabled");
}

export function showLeaveQueueButton(): void {
  qs(".pageTribe .menu .matchmaking .leaveMatchmakingButton")?.removeClass(
    "hidden",
  );
}

export function hideLeaveQueueButton(): void {
  qs(".pageTribe .menu .matchmaking .leaveMatchmakingButton")?.addClass(
    "hidden",
  );
}

export function showStartQueueButton(): void {
  qs(".pageTribe .menu .matchmaking .startMatchmakingButton")?.removeClass(
    "hidden",
  );
}

export function hideStartQueueButton(): void {
  qs(".pageTribe .menu .matchmaking .startMatchmakingButton")?.addClass(
    "hidden",
  );
}

function toggleQueue(queue: number): void {
  queues[queue] = !queues[queue];
}

function refreshQueueButtons(): void {
  const buttons = qsa(".pageTribe .menu .matchmaking .buttons button");

  buttons.removeClass("active");

  let atleastone = false;
  queues.forEach((queue, id) => {
    if (queue) {
      atleastone = true;
      buttons[id]?.addClass("active");
    }
  });
  if (!atleastone) {
    qs(".pageTribe .menu .matchmaking .startMatchmakingButton")?.addClass(
      "disabled",
    );
    qs(".pageTribe .menu .matchmaking .startMatchmakingButton")?.setHtml(
      `<i class="fas fa-times"></i>
      Select at least one queue`,
    );
  } else {
    qs(".pageTribe .menu .matchmaking .startMatchmakingButton")?.removeClass(
      "disabled",
    );
    qs(".pageTribe .menu .matchmaking .startMatchmakingButton")?.setHtml(
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

qs(".pageTribe .menu .customRooms #createCustomRoom")?.on("click", (e) => {
  disableButtons();
  tribeSocket.out.room.create(getTribeConfig());
});

qs(".pageTribe .menu .devRoom")?.on("click", (e) => {
  tribeSocket.out.dev?.room();
});

qs(".pageTribe .menu .matchmaking .buttons button")?.on("click", (e) => {
  const queue =
    (e.currentTarget as HTMLElement | null)?.getAttribute("queue") ?? "";
  toggleQueue(parseInt(queue));
  refreshQueueButtons();
});
