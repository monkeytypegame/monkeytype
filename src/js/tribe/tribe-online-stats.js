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
  Tribe.socket.emit("mp_get_online_stats");
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
