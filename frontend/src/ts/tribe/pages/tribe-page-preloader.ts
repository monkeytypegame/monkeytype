import { qs } from "../../utils/dom";

export function updateIcon(iconName: string, spinning = false): void {
  qs(".pageTribe .tribePage.preloader .icon")?.setHtml(
    `<i class="fas fa-fw fa-${iconName} ${spinning ? "fa-spin" : ""}"></i>`,
  );
}

export function updateText(text: string, html = false): void {
  if (html) {
    qs(".pageTribe .tribePage.preloader .text")?.setHtml(text);
  } else {
    qs(".pageTribe .tribePage.preloader .text")?.setText(text);
  }
}

export function updateSubtext(text: string, html = false): void {
  if (html) {
    qs(".pageTribe .tribePage.preloader .subtext")?.setHtml(text);
  } else {
    qs(".pageTribe .tribePage.preloader .subtext")?.setText(text);
  }
}

export function showReconnectButton(): void {
  qs(".pageTribe .tribePage.preloader button.reconnectButton")?.removeClass(
    `hidden`,
  );
}

export function hideReconnectButton(): void {
  qs(".pageTribe .tribePage.preloader button.reconnectButton")?.addClass(
    `hidden`,
  );
}

export function reset(): void {
  updateIcon("circle-notch", true);
  updateText("Connecting to Tribe");
  updateSubtext("Please wait...");
  hideReconnectButton();
}
