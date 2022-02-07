import * as CommandlineLists from "../elements/commandline-lists.js";
import * as Commandline from "../elements/commandline.js";
import * as Misc from "../misc";

export function reset() {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();
}

export async function fill() {
  let supporters = await Misc.getSupportersList();
  let contributors = await Misc.getContributorsList();
  supporters.forEach((supporter) => {
    $(".pageAbout .supporters").append(`
      <div>${supporter}</div>
    `);
  });
  contributors.forEach((contributor) => {
    $(".pageAbout .contributors").append(`
      <div>${contributor}</div>
    `);
  });
}

$(".supportButtons .button.ads").click((e) => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  Commandline.show();
});
