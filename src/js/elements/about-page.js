import * as CommandlineLists from "./commandline-lists.js";
import * as Commandline from "./commandline.js";

$(".supportButtons .button.ads").click((e) => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  Commandline.show();
});
