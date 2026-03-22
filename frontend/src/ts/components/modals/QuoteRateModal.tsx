import { isSafeNumber } from "@monkeytype/util/numbers";
import { JSXElement, createSignal, For } from "solid-js";

import Ape from "../../ape";
import * as DB from "../../db";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModalAndClearChain } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import {
  currentQuote,
  quoteStats,
  getQuoteStats,
  updateQuoteStats,
  getRatingAverage,
} from "../../states/quote-rate";
import { cn } from "../../utils/cn";
import { qs } from "../../utils/dom";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function QuoteRateModal(): JSXElement {
  const [rating, setRating] = createSignal(0);
  const [hoverRating, setHoverRating] = createSignal(0);

  const getLengthDesc = (): string => {
    const quote = currentQuote();
    if (!quote) return "-";
    if (quote.group === 0) return "short";
    if (quote.group === 1) return "medium";
    if (quote.group === 2) return "long";
    if (quote.group === 3) return "thicc";
    return "-";
  };

  const displayRating = (): number => hoverRating() || rating();

  const handleBeforeShow = (): void => {
    const quote = currentQuote();
    if (!quote) return;
    setRating(0);
    setHoverRating(0);
    const snapshot = DB.getSnapshot();
    const alreadyRated = snapshot?.quoteRatings?.[quote.language]?.[quote.id];
    if (isSafeNumber(alreadyRated)) {
      setRating(alreadyRated);
    }
    void getQuoteStats(quote);
  };

  const submit = async (): Promise<void> => {
    if (rating() === 0) {
      showNoticeNotification("Please select a rating");
      return;
    }
    const quote = currentQuote();
    if (!quote) return;

    hideModalAndClearChain("QuoteRate");

    showLoaderBar();
    const response = await Ape.quotes.addRating({
      body: { quoteId: quote.id, language: quote.language, rating: rating() },
    });
    hideLoaderBar();

    if (response.status !== 200) {
      showErrorNotification("Failed to submit quote rating", { response });
      return;
    }

    const snapshot = DB.getSnapshot();
    if (!snapshot) return;
    const quoteRatings = snapshot.quoteRatings ?? {};
    const languageRatings = quoteRatings?.[quote.language] ?? {};
    const stats = quoteStats() ?? {};

    if (isSafeNumber(languageRatings?.[quote.id])) {
      const oldRating = quoteRatings[quote.language]?.[quote.id] as number;
      const diff = rating() - oldRating;
      languageRatings[quote.id] = rating();
      const newStats = {
        ratings: stats?.ratings,
        totalRating: isNaN(stats?.totalRating as number)
          ? 0
          : (stats?.totalRating as number) + diff,
        quoteId: quote.id,
        language: quote.language,
      };
      updateQuoteStats(newStats);
      showSuccessNotification("Rating updated");
    } else {
      languageRatings[quote.id] = rating();
      if (isSafeNumber(stats?.ratings) && isSafeNumber(stats.totalRating)) {
        const newStats = {
          ratings: (stats.ratings as number) + 1,
          totalRating: (stats.totalRating as number) + rating(),
          quoteId: quote.id,
          language: quote.language,
        };
        updateQuoteStats(newStats);
      } else {
        updateQuoteStats({
          ratings: 1,
          totalRating: rating(),
          quoteId: quote.id,
          language: quote.language,
        });
      }
      showSuccessNotification("Rating submitted");
    }

    snapshot.quoteRatings = quoteRatings;
    DB.setSnapshot(snapshot);

    const currentStats = quoteStats();
    if (currentStats) {
      const avg = getRatingAverage(currentStats);
      updateQuoteStats({ ...currentStats, average: avg });
      qs(".pageTest #result #rateQuoteButton .rating")?.setText(avg.toFixed(1));
      qs(".pageTest #result #rateQuoteButton .icon")?.removeClass("far");
      qs(".pageTest #result #rateQuoteButton .icon")?.addClass("fas");
    }
  };

  return (
    <AnimatedModal id="QuoteRate" beforeShow={handleBeforeShow}>
      <div class="text-sm text-sub">
        If you find a grammatical error, think the quote has inappropriate
        language or feel like it's low quality -{" "}
        <span class="font-bold text-text">don't give it a low rating!</span>{" "}
        Please report it instead. You can do so by closing this popup and
        clicking the "Flag" icon.
      </div>
      <div class="grid gap-1">
        <div class="text-text" dir="auto">
          {currentQuote()?.text ?? "-"}
        </div>
        <div class="flex gap-4 text-sm text-sub">
          <div>
            <span class="text-xs">id</span> {currentQuote()?.id ?? "-"}
          </div>
          <div>
            <span class="text-xs">length</span> {getLengthDesc()}
          </div>
          <div>
            <span class="text-xs">source</span> {currentQuote()?.source ?? "-"}
          </div>
        </div>
      </div>
      <div class="flex items-center justify-center gap-4">
        <div class="text-center">
          <div class="text-xs text-sub">ratings</div>
          <div class="text-text">
            {quoteStats()?.ratings?.toString() ?? "0"}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-sub">average</div>
          <div class="text-text">
            {quoteStats()?.average?.toFixed(1) ?? "-"}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-sub">your rating</div>
          <div class="flex gap-1">
            <For each={[1, 2, 3, 4, 5]}>
              {(star) => (
                <Button
                  variant="text"
                  class={cn(
                    "text-lg",
                    displayRating() >= star
                      ? "[--themable-button-text:var(--main-color)]"
                      : "",
                  )}
                  fa={{ icon: "fa-star", fixedWidth: true }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              )}
            </For>
          </div>
        </div>
      </div>
      <Button
        variant="text"
        class="mx-auto text-lg"
        fa={{ icon: "fa-chevron-right" }}
        onClick={() => void submit()}
      />
    </AnimatedModal>
  );
}
