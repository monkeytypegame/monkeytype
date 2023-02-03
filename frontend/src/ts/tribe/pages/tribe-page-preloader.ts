export function updateIcon(iconName: string, spinning = false): void {
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-${iconName} ${spinning ? "fa-spin" : ""}"></i>`
  );
}

export function updateText(text: string, html = false): void {
  if (html) {
    $(".pageTribe .tribePage.preloader .text").html(text);
  } else {
    $(".pageTribe .tribePage.preloader .text").text(text);
  }
}

export function showReconnectButton(): void {
  $(".pageTribe .tribePage.preloader .reconnectButton").removeClass(`hidden`);
}

export function hideReconnectButton(): void {
  $(".pageTribe .tribePage.preloader .reconnectButton").addClass(`hidden`);
}
