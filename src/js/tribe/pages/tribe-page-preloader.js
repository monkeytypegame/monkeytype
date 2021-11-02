import * as Tribe from "./tribe";

export function updateIcon(iconName, spinning = false) {
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-${iconName} ${spinning ? "fa-spin" : ""}"></i>`
  );
}

export function updateText(text) {
  $(".pageTribe .tribePage.preloader .text").html(text);
}

export function showReconnectButton() {
  $(".pageTribe .tribePage.preloader .reconnectButton").removeClass(`hidden`);
}

export function hideReconnectButton() {
  $(".pageTribe .tribePage.preloader .reconnectButton").addClass(`hidden`);
}

$(".pageTribe .tribePage.preloader .reconnectButton").click((e) => {
  hideReconnectButton();
  Tribe.init();
});
