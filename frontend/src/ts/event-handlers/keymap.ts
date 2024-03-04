async function getCommandline(): Promise<
  typeof import("../commandline/commandline.js")
> {
  return await import("../commandline/commandline.js");
}

$("#keymap").on("click", ".r5 .keySpace", async () => {
  (await getCommandline()).show({
    subgroupOverride: "keymapLayouts",
  });
});

export {};
