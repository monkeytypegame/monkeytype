import * as ActivePage from "../states/active-page";
import { prefersReducedMotion } from "../utils/misc";

let visible = false;

export function hide(): void {
  $(".scrollToTopButton").addClass("invisible");
  visible = false;
}

function show(): void {
  $(".scrollToTopButton").removeClass("invisible");
  visible = true;
}

$(document).on("click", ".scrollToTopButton", () => {
  $(".scrollToTopButton").addClass("invisible");
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "instant" : "smooth",
  });
});

$(window).on("scroll", () => {
  const page = ActivePage.get();
  if (page === "test") return;

  const scroll = window.scrollY;
  if (!visible && scroll > 100) {
    show();
  } else if (visible && scroll < 100) {
    hide();
  }
});
