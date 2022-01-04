import * as Loader from "./loader";
const WD = require("word-definition");

function hide() {
  $("#wordDefinitionPopupWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#wordDefinitionPopupWrapper").addClass("hidden");
    });
}

export function show(word) {
  Loader.show();
  WD.getDef(word, "en", null, function (def) {
    if (def.err) {
      Loader.hide();
      console.log(`Getting word definition for ${word} failed: ${def.err}`);
      return;
    }
    Loader.hide();
    $("#wordDefinitionPopup .title").text(word);
    $("#wordDefinitionPopup .subtext").text(def.category);
    $("#wordDefinitionPopup .text").text(def.definition);
    $("#wordDefinitionPopupWrapper")
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  });
}

$(document.body).on("click", "#wordDefinitionPopupWrapper", (e) => {
  if ($(e.target).attr("id") === "wordDefinitionPopupWrapper") {
    hide();
  }
});
