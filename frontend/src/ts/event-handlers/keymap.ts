import * as Commandline from "../commandline/commandline";

document.getElementById("keymap")?.addEventListener("click", (e) => {
  if ((e.target as Element).closest(".r5 .layoutIndicator")) {
    Commandline.show({
      subgroupOverride: "keymapLayouts",
    });
  }
});
