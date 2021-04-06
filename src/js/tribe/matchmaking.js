let banner = $("#tribeMatchmakingStatus");

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
