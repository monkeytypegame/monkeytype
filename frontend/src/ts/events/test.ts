import * as Commandline from "../commandline/commandline";
import * as CommandlineLists from "../commandline/lists";

$(".pageTest").on("click", "#testModesNotice .textButton", (event) => {
  const attr = $(event.currentTarget).attr(
    "commands"
  ) as CommandlineLists.ListsObjectKeys;
  if (attr === undefined) return;
  const commands = CommandlineLists.getList(attr);
  if (commands !== undefined) {
    Commandline.show({ subgroupOverride: commands });
  }
});
