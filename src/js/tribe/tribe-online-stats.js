import * as Tribe from "./tribe";

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
    $(buttons[index])
      .find(".subtext")
      .text("In queue: " + num);
  });
}

export function refresh() {
  showLoading();
  Tribe.socket.emit("mp_get_online_stats");
  if (
    $(".pageTribe").hasClass("active") &&
    !$(".pageTribe .prelobby").hasClass("hidden")
  ) {
    setTimeout(() => {
      refresh();
    }, 15000);
  }
}
