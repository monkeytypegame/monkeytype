async function getCommandline(): Promise<
  typeof import("../commandline/commandline.ts")
> {
  return await import("../commandline/commandline");
}

$(".pageTest").on("click", "#testModesNotice .textButton", async (event) => {
  const attr = $(event.currentTarget).attr("commands");
  if (attr === undefined) return;
  (await getCommandline()).show({ subgroupOverride: attr });
});

export {};
