import * as UI from "../ui";

let visible = false;

$(".scrollToTopButton").click((event) => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$(window).scroll((e) => {
  let page = UI.getActivePage();
  if (page == "pageTest") return;
  if (page == "pageAbout" || page == "pageSettings" || page == "pageAccount") {
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
