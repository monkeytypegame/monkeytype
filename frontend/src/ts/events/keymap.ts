import * as Commandline from "../commandline/commandline";
import * as CommandlineLists from "../commandline/lists";

$("#keymap").on("click", ".r5 .keySpace", () => {
  Commandline.show({
    subgroupOverride: CommandlineLists.getList("keymapLayouts"),
  });
});
