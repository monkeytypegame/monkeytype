import * as Commandline from "../commandline/commandline";

$(".pageTest").on("click", "#testModesNotice .textButton", (event) => {
  const attr = $(event.currentTarget).attr("commands");
  if (attr === undefined) return;
  Commandline.show({ subgroupOverride: attr });
});
