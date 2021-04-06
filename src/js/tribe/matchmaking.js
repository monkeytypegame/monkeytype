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
  this.setText("Tribe mm status");
  this.setIcon('<i class="fas fa-spin fa-circle-notch"></i>');
  this.hide();
}

export function disableLobbyButtons() {
  $(".pageTribe .prelobby .matchmaking .buttons .button").addClass("disabled");
  $(".pageTribe .prelobby .privateRooms .button").addClass("disabled");
  $(".pageTribe .prelobby .matchmaking .leaveMatchmakingButton").removeClass(
    "hidden"
  );
}

export function enableLobbyButtons() {
  $(".pageTribe .prelobby .matchmaking .buttons .button").removeClass(
    "disabled"
  );
  $(".pageTribe .prelobby .privateRooms .button").removeClass("disabled");
  $(".pageTribe .prelobby .matchmaking .leaveMatchmakingButton").addClass(
    "hidden"
  );
}
