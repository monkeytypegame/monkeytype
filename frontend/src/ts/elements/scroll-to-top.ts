import * as ActivePage from "../states/active-page";

let visible = false;

$(document).on("click", ".scrollToTopButton", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$(window).on("scroll", () => {
  const page = ActivePage.get();
  if (page === "test") return;
  if (page === "about" || page === "settings" || page === "account") {
    const scroll = window.scrollY;
    if (!visible && scroll > 100) {
      $(".scrollToTopButton").removeClass("invisible");
      visible = true;
    } else if (visible && scroll < 100) {
      $(".scrollToTopButton").addClass("invisible");
      visible = false;
    }
  }
});
