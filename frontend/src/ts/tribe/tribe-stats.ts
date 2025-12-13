import tribeSocket from "./tribe-socket";
import * as TribeTypes from "./types";

export let inQueueNumbers = [0, 0, 0, 0];

export function showLoading(): void {
  $(".pageTribe .menu .welcome .onlineStatsLoader").removeClass("hidden");
}

export function hideLoading(): void {
  $(".pageTribe .menu .welcome .onlineStatsLoader").addClass("hidden");
}

export function updateQueueButtons(): void {
  const buttons = $(".pageTribe .menu .matchmaking .buttons .button");
  inQueueNumbers.forEach((num, index) => {
    $(buttons[index] as HTMLElement)
      .find(".subtext .waiting")
      .text(`Waiting: ${num}`);
  });
}

// export function incrementQueues(queues): void {
//   queues.forEach((queue) => {
//     inQueueNumbers[queue]++;
//   });
//   updateQueueButtons();
// }

// export function decrementQueues(queues): void {
//   queues.forEach((queue) => {
//     inQueueNumbers[queue]--;
//   });
//   updateQueueButtons();
// }

export function setInQueue(newQueNumArray: number[]): void {
  inQueueNumbers = newQueNumArray;
  updateQueueButtons();
}

export function updateMenuButtons(
  races: TribeTypes.SystemStats["stats"]["1"],
): void {
  let buttons = $(".pageTribe .menu .matchmaking .buttons .button");
  races.mm.forEach((num: number, index: number) => {
    $(buttons[index] as HTMLElement)
      .find(".subtext .races")
      .text(`Races: ${num}`);
  });

  buttons = $(".pageTribe .menu .customRooms .buttons .button");
  races.custom.forEach((num: number, index: number) => {
    $(buttons[index] as HTMLElement)
      .find(".subtext .rooms")
      .text(`Rooms: ${num}`);
  });
}

let to: NodeJS.Timeout | null = null;

export async function refresh(): Promise<void> {
  showLoading();

  const start = performance.now();
  void tribeSocket.out.system.stats().then((data) => {
    const ping = Math.round(performance.now() - start);
    hideLoading();
    setInQueue(data.stats[2]);
    updateMenuButtons(data.stats[1]);
    $(".pageTribe .menu .welcome .stats").empty();
    $(".pageTribe .menu .welcome .stats").append(
      `<div>Online <span class="num">${data.stats[0]}</span></div>`,
    );
    $(".pageTribe .menu .welcome .stats").append(
      `<div class="small">Version ${data.stats[3]}</div>`,
    );
    $(".pageTribe .menu .welcome .stats").append(
      `<div class="small">Ping ${ping}ms</div>`,
    );
  });
  if (
    $(".pageTribe").hasClass("active") &&
    !$(".pageTribe .menu").hasClass("hidden") &&
    to === null
  ) {
    to = setTimeout(() => {
      to = null;
      void refresh();
    }, 15000);
  }
}
