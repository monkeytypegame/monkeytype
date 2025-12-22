export function updateIcon(iconName: string, spinning = false): void {
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-${iconName} ${spinning ? "fa-spin" : ""}"></i>`,
  );
}

export function updateText(text: string, html = false): void {
  if (html) {
    $(".pageTribe .tribePage.preloader .text").html(text);
  } else {
    $(".pageTribe .tribePage.preloader .text").text(text);
  }
}

export function updateSubtext(text: string, html = false): void {
  if (html) {
    $(".pageTribe .tribePage.preloader .subtext").html(text);
  } else {
    $(".pageTribe .tribePage.preloader .subtext").text(text);
  }
}

export function showReconnectButton(): void {
  $(".pageTribe .tribePage.preloader .reconnectButton").removeClass(`hidden`);
}

export function hideReconnectButton(): void {
  $(".pageTribe .tribePage.preloader .reconnectButton").addClass(`hidden`);
}

export function reset(): void {
  updateIcon("circle-notch", true);
  updateText("Connecting to Tribe");
  updateSubtext("Please wait...");
  hideReconnectButton();
}
