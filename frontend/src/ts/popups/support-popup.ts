import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "supportMeWrapper";

function show(): void {
  Skeleton.append(wrapperId);

  $("#supportMeWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
}

function hide(): void {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
      Skeleton.remove(wrapperId);
    });
}

$("#supportMeButton").on("click", () => {
  show();
});

$("main").on("click", ".pageAbout #supportMeAboutButton", () => {
  show();
});

$("#popups").on("click", "#supportMeWrapper", () => {
  hide();
});

$("#popups").on("click", "#supportMeWrapper .button.ads", () => {
  hide();
});

$("#popups").on("click", "#supportMeWrapper a.button", () => {
  hide();
});

$(document).on("keydown", (e) => {
  if (e.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
  }
});

Skeleton.save(wrapperId);
