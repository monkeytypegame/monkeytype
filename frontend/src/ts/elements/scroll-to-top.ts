import * as ActivePage from "../states/active-page";
import { prefersReducedMotion } from "../utils/misc";

let visible: boolean = false;

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
  const page: string = ActivePage.get();
  if (page === "test") return;

  const scroll: number = window.scrollY;
  if (!visible && scroll > 100) {
    show();
  } else if (visible && scroll < 100) {
    hide();
  }
});

// fix the button visibility (IN TEST PAGE)
function updateButtonVisibility(): void {
  const page: string = ActivePage.get();
  const $button: JQuery<HTMLElement> = $(".scrollToTopButton");
  if (page === "test") {
    $button.css("display", "none");
  } else {
    $button.css("display", "block");
  }
}

$(document).ready(() => {
  updateButtonVisibility();
});

setInterval(() => {
  updateButtonVisibility();
}, 100);

window.onpopstate = (): void => {
  updateButtonVisibility();
};
