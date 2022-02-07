import * as Commandline from "../commandline";
import * as CommandlineLists from "../commandline-lists";

$(document.body).on("click", "#supportMeButton", () => {
  $("#supportMeWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#supportMeWrapper", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeWrapper .button.ads", () => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  Commandline.show();
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeWrapper a.button", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});
