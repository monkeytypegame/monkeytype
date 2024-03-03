import * as Commandline from "../commandline/commandline";

$("#popups").on("click", "#supportMeWrapper button.ads", () => {
  Commandline.show({ subgroupOverride: "enableAds" });
});
