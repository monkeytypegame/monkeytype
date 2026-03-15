import { qs, qsa } from "../utils/dom";
import tribeSocket from "./tribe-socket";
import * as TribeTypes from "./types";

export let inQueueNumbers = [0, 0, 0, 0];

export function showLoading(): void {
  qs(".pageTribe .menu .welcome .onlineStatsLoader")?.removeClass("hidden");
}

export function hideLoading(): void {
  qs(".pageTribe .menu .welcome .onlineStatsLoader")?.addClass("hidden");
}

export function updateQueueButtons(): void {
  const buttons = qsa(".pageTribe .menu .matchmaking .buttons button");
  inQueueNumbers.forEach((num, index) => {
    buttons[index]?.qs(".subtext .waiting")?.setText(`Waiting: ${num}`);
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
  let buttons = qsa(".pageTribe .menu .matchmaking .buttons button");
  races.mm.forEach((num: number, index: number) => {
    buttons[index]?.qs(".subtext .races")?.setText(`Races: ${num}`);
  });

  buttons = qsa(".pageTribe .menu .customRooms .buttons button");
  races.custom.forEach((num: number, index: number) => {
    buttons[index]?.qs(".subtext .rooms")?.setText(`Rooms: ${num}`);
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
    qs(".pageTribe .menu .welcome .stats")?.empty();
    qs(".pageTribe .menu .welcome .stats")?.appendHtml(
      `<div>Online <span class="num">${data.stats[0]}</span></div>`,
    );
    qs(".pageTribe .menu .welcome .stats")?.appendHtml(
      `<div class="small">Version ${data.stats[3]}</div>`,
    );
    qs(".pageTribe .menu .welcome .stats")?.appendHtml(
      `<div class="small">Ping ${ping}ms</div>`,
    );
  });
  if (
    qs(".pageTribe")?.hasClass("active") &&
    !qs(".pageTribe .menu")?.hasClass("hidden") &&
    to === null
  ) {
    to = setTimeout(() => {
      to = null;
      void refresh();
    }, 15000);
  }
}
