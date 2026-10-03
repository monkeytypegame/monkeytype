import { Config } from "../config/store";
import { __nonReactive } from "../collections/tags";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../states/notifications";
import { showQuoteRateModal } from "../states/quote-rate";
import { showQuoteReportModal } from "../states/quote-report";
import { navigate } from "../router/navigate";
import { getMode2 } from "../utils/misc";
import { qs } from "../utils/dom";
import { getCurrentQuote } from "../states/test";
import { showEditResultTagsModal } from "../states/edit-result-tags";
import { showModal } from "../states/modals";
import { onTestPageClick } from "../elements/test-page";

onTestPageClick(".tags .editTagsButton", () => {
  if (__nonReactive.getTags().length > 0) {
    const resultid =
      qs(".pageTest .tags .editTagsButton")?.getAttribute("data-result-id") ??
      "";
    const activeTagIds =
      qs(".pageTest .tags .editTagsButton")?.getAttribute(
        "data-active-tag-ids",
      ) ?? "";
    const tags = activeTagIds === "" ? [] : activeTagIds.split(",");
    showEditResultTagsModal({ _id: resultid, tags, source: "resultPage" });
  }
});

onTestPageClick("#rateQuoteButton", async () => {
  const currentQuote = getCurrentQuote();
  if (currentQuote === null) {
    showErrorNotification("Failed to show quote rating popup: no quote");
    return;
  }
  showQuoteRateModal(currentQuote);
});

onTestPageClick("#reportQuoteButton", async () => {
  const currentQuote = getCurrentQuote();
  if (currentQuote === null) {
    showErrorNotification("Failed to show quote report popup: no quote");
    return;
  }
  showQuoteReportModal(currentQuote?.id);
});

onTestPageClick("#practiseWordsButton", () => {
  if (Config.mode === "zen") {
    showNoticeNotification("Practice words is unsupported in zen mode");
    return;
  }
  showModal("PractiseWords");
});

onTestPageClick("#dailyLeaderboardRank", async () => {
  void navigate(
    `/leaderboards?type=daily&language=${Config.language}&mode2=${getMode2(
      Config,
      null,
    )}&goToUserPage=true`,
  );
});
