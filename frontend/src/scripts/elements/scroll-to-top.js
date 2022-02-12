import * as ActivePage from "../states/active-page";

let visible = false;

$(".scrollToTopButton").click((event) => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$(window).scroll((e) => {
  let page = ActivePage.get();
  if (page == "test") return;
  if (page == "about" || page == "settings" || page == "account") {
    let scroll = window.scrollY;
    if (!visible && scroll > 100) {
      $(".scrollToTopButton").removeClass("invisible");
      visible = true;
    } else if (visible && scroll < 100) {
      $(".scrollToTopButton").addClass("invisible");
      visible = false;
    }
  }
});
