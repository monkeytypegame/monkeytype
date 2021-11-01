import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

export let inQueueNumbers = [0, 0, 0, 0];

export function showLoading() {
  $(".pageTribe .prelobby .welcome .onlineStatsLoader").removeClass("hidden");
}

export function hideLoading() {
  $(".pageTribe .prelobby .welcome .onlineStatsLoader").addClass("hidden");
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

export function updateQueueButtons() {
  let buttons = $(".pageTribe .prelobby .matchmaking .buttons .button");
  inQueueNumbers.forEach((num, index) => {
    $(buttons[index]).find(".subtext .waiting").text(`Waiting: ${num}`);
    // .html(`
    // <div class='races'>Races: 0</div>
    // <div class='waiting'></div>
    // `);
  });
}

export function updateRaces(races) {
  let buttons = $(".pageTribe .prelobby .matchmaking .buttons .button");
  races.public.forEach((num, index) => {
    $(buttons[index]).find(".subtext .races").text(`Races: ${num}`);
  });
  $(
    ".pageTribe .prelobby .privateRooms #createPrivateRoom .subtext .rooms"
  ).text(`Rooms: ${races.private}`);
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
      updateRaces(data.stats[1]);
      $(".pageTribe .prelobby .welcome .stats").empty();
      $(".pageTribe .prelobby .welcome .stats").append(
        `<div>Online <span class="num">${data.stats[0]}</span></div>`
      );
      $(".pageTribe .prelobby .welcome .stats").append(
        `<div class="small">Version ${data.stats[3]}</div>`
      );
      $(".pageTribe .prelobby .welcome .stats").append(
        `<div class="small">Ping ${ping}ms</div>`
      );
    }
  );
  if (
    $(".pageTribe").hasClass("active") &&
    !$(".pageTribe .prelobby").hasClass("hidden") &&
    to == null
  ) {
    to = setTimeout(() => {
      to = null;
      refresh();
    }, 15000);
  }
}
