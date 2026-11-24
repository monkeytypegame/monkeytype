import { getConfig } from "../../config/store";
import { isQuoteFavorite, setQuoteFavorite } from "../../queries/user";
import { Quote } from "../../constants/quotes";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { isAuthenticated } from "../../auth/state";
import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import { Command } from "../types";
import { getCurrentQuote } from "../../states/test";

const commands: Command[] = [
  {
    id: "addQuoteToFavorite",
    display: "Add current quote to favorite",
    fa: { icon: "fa-heart" },
    available: (): boolean => {
      const quote = getCurrentQuote();
      return (
        isAuthenticated() &&
        quote !== null &&
        getConfig.mode === "quote" &&
        !isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      showLoaderBar();
      const quote = getCurrentQuote() as Quote;
      const { error } = await setQuoteFavorite({
        language: quote.language,
        quoteId: quote.id.toString(),
        favorite: true,
      });
      hideLoaderBar();
      if (error !== null) {
        showErrorNotification("Failed to add quote to favorites", { error });
        return;
      }
      showSuccessNotification("Quote added to favorites");
    },
  },
  {
    id: "removeQuoteFromFavorite",
    display: "Remove current quote from favorite",
    fa: { icon: "fa-heart-broken" },
    available: (): boolean => {
      const quote = getCurrentQuote();
      return (
        isAuthenticated() &&
        quote !== null &&
        getConfig.mode === "quote" &&
        isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      showLoaderBar();
      const quote = getCurrentQuote() as Quote;
      const { error } = await setQuoteFavorite({
        language: quote.language,
        quoteId: quote.id.toString(),
        favorite: false,
      });
      hideLoaderBar();
      if (error !== null) {
        showErrorNotification("Failed to remove quote from favorites", {
          error,
        });
        return;
      }
      showSuccessNotification("Quote removed from favorites");
    },
  },
];

export default commands;
