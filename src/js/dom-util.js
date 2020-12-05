import { $ } from "jquery";

export function showBackgroundLoader() {
  $("#backgroundLoader").stop(true, true).fadeIn(125);
}

export function hideBackgroundLoader() {
  $("#backgroundLoader").stop(true, true).fadeOut(125);
}
