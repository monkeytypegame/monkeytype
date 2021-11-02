import * as Tribe from "./tribe";

export let inQueueNumbers = [0, 0, 0, 0];

export function showLoading() {
  $(".pageTribe .menu .welcome .onlineStatsLoader").removeClass("hidden");
}

export function hideLoading() {
  $(".pageTribe .menu .welcome .onlineStatsLoader").addClass("hidden");
}

export function updateQueueButtons() {
  let buttons = $(".pageTribe .menu .matchmaking .buttons .button");
  inQueueNumbers.forEach((num, index) => {
    $(buttons[index]).find(".subtext .waiting").text(`Waiting: ${num}`);
  });
}

export function incrementQueues(queues) {
  queues.forEach((queue) => {
    inQueueNumbers[queue]++;
  });
  updateQueueButtons();
}

export function decrementQueues(queues) {
  queues.forEach((queue) => {
    inQueueNumbers[queue]--;
  });
  updateQueueButtons();
}

export function setInQueue(newNum) {
  inQueueNumbers = newNum;
  updateQueueButtons();
}

export function updateMenuButtons(races) {
  let buttons = $(".pageTribe .menu .matchmaking .buttons .button");
  races.mm.forEach((num, index) => {
    $(buttons[index]).find(".subtext .races").text(`Races: ${num}`);
  });

  buttons = $(".pageTribe .menu .customRooms .buttons .button");
  races.custom.forEach((num, index) => {
    $(buttons[index]).find(".subtext .rooms").text(`Rooms: ${num}`);
  });
}

let to = null;

export function refresh() {
  showLoading();
  Tribe.socket.emit(
    "system_stats",
    { pingStart: performance.now() },
    (data) => {
      let ping = Math.round(performance.now() - data.pingStart);
      hideLoading();
      setInQueue(data.stats[2]);
      updateMenuButtons(data.stats[1]);
      $(".pageTribe .menu .welcome .stats").empty();
      $(".pageTribe .menu .welcome .stats").append(
        `<div>Online <span class="num">${data.stats[0]}</span></div>`
      );
      $(".pageTribe .menu .welcome .stats").append(
        `<div class="small">Version ${data.stats[3]}</div>`
      );
      $(".pageTribe .menu .welcome .stats").append(
        `<div class="small">Ping ${ping}ms</div>`
      );
    }
  );
  if (
    $(".pageTribe").hasClass("active") &&
    !$(".pageTribe .menu").hasClass("hidden") &&
    to == null
  ) {
    to = setTimeout(() => {
      to = null;
      refresh();
    }, 15000);
  }
}
