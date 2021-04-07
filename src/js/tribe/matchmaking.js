let banner = $("#tribeMatchmakingStatus");

export let queues = [true, true, true, true];

export function showBanner() {
  banner.removeClass("hidden");
}

export function hideBanner() {
  banner.addClass("hidden");
}

export function setBannerText(text) {
  banner.find(".text").text(text);
}

export function setBannerIcon(html) {
  banner.find(".icon").html(html);
}

export function resetBanner() {
  setBannerText("Tribe mm status");
  setBannerIcon('<i class="fas fa-spin fa-circle-notch"></i>');
  hideBanner();
}

export function disableLobbyButtons() {
  $(".pageTribe .prelobby .matchmaking .buttons .button").addClass("disabled");
  $(".pageTribe .prelobby .privateRooms .button").addClass("disabled");
}

export function enableLobbyButtons() {
  $(".pageTribe .prelobby .matchmaking .buttons .button").removeClass(
    "disabled"
  );
  $(".pageTribe .prelobby .privateRooms .button").removeClass("disabled");
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
  } else {
    $(".pageTribe .prelobby .matchmaking .startMatchmakingButton").removeClass(
      "disabled"
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

$(".pageTribe .prelobby .matchmaking .buttons .button").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  let queue = $(e.currentTarget).attr("queue");
  toggleQueue(queue);
  refreshQueueButtons();
});
