import * as Commandline from "../commandline/commandline";
import { Config } from "../config/store";
import * as DB from "../db";
import * as EditResultTagsModal from "../modals/edit-result-tags";
import * as TestWords from "../test/test-words";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../states/notifications";
import { showQuoteRateModal } from "../states/quote-rate";
import { showQuoteReportModal } from "../states/quote-report";
import * as PractiseWordsModal from "../modals/practise-words";
import { navigate } from "../controllers/route-controller";
import { getMode2 } from "../utils/misc";
import { ConfigKey } from "@monkeytype/schemas/configs";
import { ListsObjectKeys } from "../commandline/lists";
import { qs } from "../utils/dom";

const testPage = qs(".pageTest");

testPage?.onChild("click", "#testModesNotice .textButton", async (event) => {
  const target = event.childTarget as HTMLElement;
  const attr = target?.getAttribute("commands");
  if (attr === null) return;
  Commandline.show({ subgroupOverride: attr as ConfigKey | ListsObjectKeys });
});

testPage?.onChild("click", "#testModesNotice .textButton", async (event) => {
  const target = event.childTarget as HTMLElement;
  const attr = target?.getAttribute("commandId");
  if (attr === null) return;
  Commandline.show({ commandOverride: attr });
});

testPage?.onChild("click", ".tags .editTagsButton", () => {
  if ((DB.getSnapshot()?.tags?.length ?? 0) > 0) {
    const resultid =
      qs(".pageTest .tags .editTagsButton")?.getAttribute("data-result-id") ??
      "";
    const activeTagIds =
      qs(".pageTest .tags .editTagsButton")?.getAttribute(
        "data-active-tag-ids",
      ) ?? "";
    const tags = activeTagIds === "" ? [] : activeTagIds.split(",");
    EditResultTagsModal.show(resultid, tags, "resultPage");
  }
});

qs(".pageTest #rateQuoteButton")?.on("click", async () => {
  if (TestWords.currentQuote === null) {
    showErrorNotification("Failed to show quote rating popup: no quote");
    return;
  }
  showQuoteRateModal(TestWords.currentQuote);
});

qs(".pageTest #reportQuoteButton")?.on("click", async () => {
  if (TestWords.currentQuote === null) {
    showErrorNotification("Failed to show quote report popup: no quote");
    return;
  }
  showQuoteReportModal(TestWords.currentQuote?.id);
});

testPage?.onChild("click", "#practiseWordsButton", () => {
  if (Config.mode === "zen") {
    showNoticeNotification("Practice words is unsupported in zen mode");
    return;
  }
  PractiseWordsModal.show();
});

qs(".pageTest #dailyLeaderboardRank")?.on("click", async () => {
  void navigate(
    `/leaderboards?type=daily&language=${Config.language}&mode2=${getMode2(
      Config,
      null,
    )}&goToUserPage=true`,
  );
});
