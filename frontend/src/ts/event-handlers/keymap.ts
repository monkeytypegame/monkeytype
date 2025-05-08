import * as Commandline from "../commandline/commandline";

$("#keymap").on("click", ".r5 .layoutIndicator", async () => {
  Commandline.show({
    subgroupOverride: "keymapLayouts",
  });
});
