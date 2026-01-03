import * as Commandline from "../commandline/commandline";
import * as CustomWordAmount from "../modals/custom-word-amount";
import Config from "../config";
import * as DB from "../db";
import * as EditResultTagsModal from "../modals/edit-result-tags";
import * as MobileTestConfigModal from "../modals/mobile-test-config";
import * as CustomTestDurationModal from "../modals/custom-test-duration";
import * as TestWords from "../test/test-words";
import * as Notifications from "../elements/notifications";
import * as QuoteRateModal from "../modals/quote-rate";
import * as QuoteReportModal from "../modals/quote-report";
import * as QuoteSearchModal from "../modals/quote-search";
import * as CustomTextModal from "../modals/custom-text";
import * as PractiseWordsModal from "../modals/practise-words";
import { navigate } from "../controllers/route-controller";
import { getMode2 } from "../utils/misc";
import * as ShareTestSettingsPopup from "../modals/share-test-settings";
import { qs } from "../utils/dom";

const testPage = qs(".pageTest");

testPage?.onChild("click", "#testModesNotice .textButton", async (event) => {
  const target = event.childTarget as HTMLElement;
  const attr = target?.getAttribute("commands");
  if (attr === null) return;
  Commandline.show({ subgroupOverride: attr });
});

testPage?.onChild("click", "#testModesNotice .textButton", async (event) => {
  const target = event.childTarget as HTMLElement;
  const attr = target?.getAttribute("commandId");
  if (attr === null) return;
  Commandline.show({ commandOverride: attr });
});

testPage?.onChild("click", "#testConfig .wordCount .textButton", (event) => {
  const target = event.childTarget as HTMLElement;
  const wrd = target?.getAttribute("wordCount");
  if (wrd === "custom") {
    CustomWordAmount.show();
  }
});

testPage?.onChild("click", "#testConfig .time .textButton", (event) => {
  const target = event.childTarget as HTMLElement;
  const time = target?.getAttribute("timeconfig");
  if (time === "custom") {
    CustomTestDurationModal.show();
  }
});

testPage?.onChild("click", "#testConfig .shareButton", () => {
  ShareTestSettingsPopup.show();
});

testPage?.onChild("click", ".tags .editTagsButton", () => {
  if ((DB.getSnapshot()?.tags?.length ?? 0) > 0) {
    const resultid =
      qs(".pageTest .tags .editTagsButton")?.getAttribute("data-result-id") ??
      "";
    const activeTagIds = qs(".pageTest .tags .editTagsButton")?.getAttribute(
      "data-active-tag-ids",
    );
    const tags =
      activeTagIds === "" || activeTagIds === null || activeTagIds === undefined
        ? []
        : activeTagIds.split(",");
    EditResultTagsModal.show(resultid, tags, "resultPage");
  }
});

testPage?.onChild("click", "#mobileTestConfigButton", () => {
  MobileTestConfigModal.show();
});

qs(".pageTest #rateQuoteButton")?.on("click", async () => {
  if (TestWords.currentQuote === null) {
    Notifications.add("Failed to show quote rating popup: no quote", -1);
    return;
  }
  QuoteRateModal.show(TestWords.currentQuote);
});

qs(".pageTest #reportQuoteButton")?.on("click", async () => {
  if (TestWords.currentQuote === null) {
    Notifications.add("Failed to show quote report popup: no quote", -1);
    return;
  }
  void QuoteReportModal.show(TestWords.currentQuote?.id);
});

testPage?.onChild("click", "#testConfig .quoteLength .textButton", (event) => {
  const target = event.childTarget as HTMLElement;
  const len = parseInt(target?.getAttribute("quoteLength") ?? "0");
  if (len === -2) {
    void QuoteSearchModal.show();
  }
});

testPage?.onChild("click", "#testConfig .customText .textButton", () => {
  CustomTextModal.show();
});

testPage?.onChild("click", "#practiseWordsButton", () => {
  if (Config.mode === "zen") {
    Notifications.add("Practice words is unsupported in zen mode", 0);
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
