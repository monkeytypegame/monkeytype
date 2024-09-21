import Config from "../../config";
import QuotesController, { Quote } from "../../controllers/quotes-controller";
import * as Notifications from "../../elements/notifications";
import { isAuthenticated } from "../../firebase";
import { createErrorMessage } from "../../utils/misc";
import * as Loader from "../../elements/loader";
import * as TestWords from "../../test/test-words";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "addQuoteToFavorite",
    display: "Add current quote to favorite",
    icon: "fa-heart",
    available: (): boolean => {
      const quote = TestWords.currentQuote;
      return (
        isAuthenticated() &&
        quote !== null &&
        Config.mode === "quote" &&
        !QuotesController.isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        Loader.show();
        await QuotesController.setQuoteFavorite(
          TestWords.currentQuote as Quote,
          true
        );
        Loader.hide();
        Notifications.add("Quote added to favorites", 1);
      } catch (e) {
        Loader.hide();
        const message = createErrorMessage(
          e,
          "Failed to add quote to favorites"
        );
        Notifications.add(message, -1);
      }
    },
  },
  {
    id: "removeQuoteFromFavorite",
    display: "Remove current quote from favorite",
    icon: "fa-heart-broken",
    available: (): boolean => {
      const quote = TestWords.currentQuote;
      return (
        isAuthenticated() &&
        quote !== null &&
        Config.mode === "quote" &&
        QuotesController.isQuoteFavorite(quote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        Loader.show();
        await QuotesController.setQuoteFavorite(
          TestWords.currentQuote as Quote,
          false
        );
        Loader.hide();
        Notifications.add("Quote removed from favorites", 1);
      } catch (e) {
        Loader.hide();
        const message = createErrorMessage(
          e,
          "Failed to remove quote from favorites"
        );
        Notifications.add(message, -1);
      }
    },
  },
];

export default commands;
