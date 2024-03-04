async function getCommandline(): Promise<
  typeof import("../commandline/commandline.js")
> {
  return await import("../commandline/commandline.js");
}

$(".pageTest").on("click", "#testModesNotice .textButton", async (event) => {
  const attr = $(event.currentTarget).attr("commands");
  if (attr === undefined) return;
  (await getCommandline()).show({ subgroupOverride: attr });
});

export {};
