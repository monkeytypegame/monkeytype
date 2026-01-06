import * as Commandline from "../commandline/commandline";
import { qs } from "../utils/dom";

qs("#keymap")?.onChild("click", ".r5 .layoutIndicator", async () => {
  Commandline.show({
    subgroupOverride: "keymapLayout",
  });
});
