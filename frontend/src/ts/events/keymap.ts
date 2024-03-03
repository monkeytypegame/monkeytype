async function getCommandline(): Promise<
  typeof import("../commandline/commandline.ts")
> {
  return await import("../commandline/commandline");
}

$("#keymap").on("click", ".r5 .keySpace", async () => {
  (await getCommandline()).show({
    subgroupOverride: "keymapLayouts",
  });
});

export {};
