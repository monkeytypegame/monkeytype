import { getCommandline } from "../utils/async-modules";

$(".pageTest").on("click", "#testModesNotice .textButton", async (event) => {
  const attr = $(event.currentTarget).attr("commands");
  if (attr === undefined) return;
  (await getCommandline()).show({ subgroupOverride: attr });
});

export {};
