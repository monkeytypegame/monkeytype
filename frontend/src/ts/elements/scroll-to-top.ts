import * as ActivePage from "../states/active-page";
import { prefersReducedMotion } from "../utils/accessibility";
import { qsr } from "../utils/dom";

let visible = false;

const button = qsr(".scrollToTopButton");

export function hide(): void {
  button.addClass("invisible");
  visible = false;
}

function show(): void {
  button.removeClass("invisible");
  visible = true;
}

button.on("click", () => {
  button.addClass("invisible");
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "instant" : "smooth",
  });
});

window.addEventListener("scroll", () => {
  const page = ActivePage.get();
  if (page === "test") return;

  const scroll = window.scrollY;
  if (!visible && scroll > 100) {
    show();
  } else if (visible && scroll < 100) {
    hide();
  }
});
