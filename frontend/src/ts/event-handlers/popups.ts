import { getCommandline } from "../utils/async-modules";

$("#popups").on("click", "#supportMeWrapper button.ads", async () => {
  (await getCommandline()).show({ subgroupOverride: "enableAds" });
});
