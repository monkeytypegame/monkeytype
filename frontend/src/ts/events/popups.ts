import * as Commandline from "../commandline/commandline";
import * as CommandlineLists from "../commandline/lists";

$("#popups").on("click", "#supportMeWrapper button.ads", () => {
  Commandline.show({ subgroupOverride: CommandlineLists.getList("enableAds") });
});
