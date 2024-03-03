import * as Commandline from "../commandline/commandline";

$("#keymap").on("click", ".r5 .keySpace", () => {
  Commandline.show({
    subgroupOverride: "keymapLayouts",
  });
});
