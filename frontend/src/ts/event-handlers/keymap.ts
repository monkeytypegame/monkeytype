import { getCommandline } from "../utils/async-modules";

$("#keymap").on("click", ".r5 .layoutIndicator", async () => {
  (await getCommandline()).show({
    subgroupOverride: "keymapLayouts",
  });
});
