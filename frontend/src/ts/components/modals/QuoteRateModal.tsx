import { isSafeNumber } from "@monkeytype/util/numbers";
import { JSXElement, createSignal, For } from "solid-js";

import { rateQuote } from "../../collections/user";
import * as DB from "../../db";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModalAndClearChain } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import {
  selectedQuote,
  quoteStats,
  getQuoteStats,
  updateQuoteStats,
  getRatingAverage,
} from "../../states/quote-rate";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";
import { Separator } from "../common/Separator";

export function QuoteRateModal(): JSXElement {
  const [rating, setRating] = createSignal(0);
  const [hoverRating, setHoverRating] = createSignal(0);

  const getLengthDesc = (): string => {
    const quote = selectedQuote();
    if (!quote) return "-";
    if (quote.group === 0) return "short";
    if (quote.group === 1) return "medium";
    if (quote.group === 2) return "long";
    if (quote.group === 3) return "thicc";
    return "-";
  };

  const displayRating = (): number => hoverRating() || rating();

  const handleBeforeShow = (): void => {
    const quote = selectedQuote();
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
    const quote = selectedQuote();
    if (!quote) return;

    hideModalAndClearChain("QuoteRate");

    const oldRating =
      DB.getSnapshot()?.quoteRatings?.[quote.language]?.[quote.id];

    showLoaderBar();
    try {
      await rateQuote({
        language: quote.language,
        quoteId: quote.id,
        rating: rating(),
      });
    } catch (error) {
      hideLoaderBar();
      showErrorNotification("Failed to submit quote rating", { error });
      return;
    }
    hideLoaderBar();

    const stats = quoteStats() ?? {};

    if (isSafeNumber(oldRating)) {
      const diff = rating() - oldRating;
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
      if (isSafeNumber(stats?.ratings) && isSafeNumber(stats.totalRating)) {
        const newStats = {
          ratings: stats.ratings + 1,
          totalRating: stats.totalRating + rating(),
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

    const currentStats = quoteStats();
    if (currentStats) {
      const avg = getRatingAverage(currentStats);
      updateQuoteStats({ ...currentStats, average: avg });
    }
  };

  return (
    <AnimatedModal
      id="QuoteRate"
      beforeShow={handleBeforeShow}
      modalClass="max-w-[800px] overflow-visible"
    >
      <div class="text-text">
        If you find a grammatical error or the quote has inappropriate language
        - <span class="text-error">don{"'"}t give it a low rating!</span> Please
        report it instead. You can do so by closing this popup and clicking the{" "}
        <Fa class="text-sub" icon="fa-flag" /> flag icon.
      </div>
      <Separator />
      <div class="grid gap-2">
        <div class="text-xl text-text" dir="auto">
          {selectedQuote()?.text ?? "-"}
        </div>
        <div class="grid grid-cols-[1fr_1fr_3fr] gap-2">
          <div class="text-xs text-sub">
            <div class="text-sub opacity-50">id</div>
            {selectedQuote()?.id ?? "-"}
          </div>
          <div class="text-xs text-sub">
            <div class="text-sub opacity-50">length</div>
            {getLengthDesc()}
          </div>
          <div class="text-xs text-sub">
            <div class="text-sub opacity-50">source</div>
            {selectedQuote()?.source ?? "-"}
          </div>
        </div>
      </div>
      <Separator />
      <div class="flex items-center gap-4">
        <div class="grid flex-1 grid-cols-4 gap-4">
          <div>
            <div class="text-sub">ratings</div>
            <div class="text-4xl text-text">
              {quoteStats()?.ratings?.toString() ?? "0"}
            </div>
          </div>
          <div>
            <div class="text-sub">average</div>
            <div class="text-4xl text-text">
              {quoteStats()?.average?.toFixed(1) ?? "-"}
            </div>
          </div>
          <div>
            <div class="text-sub">your rating</div>
            <div class="flex gap-1 text-2xl">
              <For each={[1, 2, 3, 4, 5]}>
                {(star) => (
                  <Button
                    variant="text"
                    class={cn(
                      "p-0 text-2xl",
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
          class="text-3xl"
          fa={{ icon: "fa-chevron-right" }}
          onClick={() => void submit()}
        />
      </div>
    </AnimatedModal>
  );
}
