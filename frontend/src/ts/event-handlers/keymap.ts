import { getCommandline } from "../utils/async-modules.js";

$("#keymap").on("click", ".r5 .keySpace", async () => {
  (await getCommandline()).show({
    subgroupOverride: "keymapLayouts",
  });
});
