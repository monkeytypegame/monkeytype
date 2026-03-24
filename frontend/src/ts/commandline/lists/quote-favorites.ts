import { Config } from "../../config/store";
import QuotesController, { Quote } from "../../controllers/quotes-controller";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { isAuthenticated } from "../../firebase";
import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import { Command } from "../types";
import { getCurrentQuote } from "../../states/test";

const commands: Command[] = [
  {
    id: "addQuoteToFavorite",
    display: "Add current quote to favorite",
    icon: "fa-heart",
    available: (): boolean => {
      const quote = getCurrentQuote();
      return (
        isAuthenticated() &&
        quote !== null &&
        Config.mode === "quote" &&
        !QuotesController.isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        showLoaderBar();
        await QuotesController.setQuoteFavorite(
          getCurrentQuote() as Quote,
          true,
        );
        hideLoaderBar();
        showSuccessNotification("Quote added to favorites");
      } catch (e) {
        hideLoaderBar();
        showErrorNotification("Failed to add quote to favorites", { error: e });
      }
    },
  },
  {
    id: "removeQuoteFromFavorite",
    display: "Remove current quote from favorite",
    icon: "fa-heart-broken",
    available: (): boolean => {
      const quote = getCurrentQuote();
      return (
        isAuthenticated() &&
        quote !== null &&
        Config.mode === "quote" &&
        QuotesController.isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        showLoaderBar();
        await QuotesController.setQuoteFavorite(
          getCurrentQuote() as Quote,
          false,
        );
        hideLoaderBar();
        showSuccessNotification("Quote removed from favorites");
      } catch (e) {
        hideLoaderBar();
        showErrorNotification("Failed to remove quote from favorites", {
          error: e,
        });
      }
    },
  },
];

export default commands;
