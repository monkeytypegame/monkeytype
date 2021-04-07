import * as Tribe from "./tribe";

export function showLoading() {
  $(".pageTribe .prelobby .welcome .onlineStatsLoader").removeClass("hidden");
}

export function hideLoading() {
  $(".pageTribe .prelobby .welcome .onlineStatsLoader").addClass("hidden");
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
    }, 10000);
  }
}
