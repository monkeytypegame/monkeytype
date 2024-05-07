import Config from "../../config";
import QuotesController from "../../controllers/quotes-controller";
import * as Notifications from "../../elements/notifications";
import { isAuthenticated } from "../../firebase";
import { createErrorMessage } from "../../utils/misc";
import * as Loader from "../../elements/loader";

const commands: MonkeyTypes.Command[] = [
  {
    id: "addQuoteToFavorite",
    display: "Add current quote to favorite",
    icon: "fa-heart",
    available: (): boolean => {
      const currentQuote = QuotesController.getCurrentQuote();
      return (
        isAuthenticated() &&
        currentQuote !== null &&
        Config.mode === "quote" &&
        !QuotesController.isQuoteFavorite(currentQuote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        Loader.show();
        await QuotesController.setQuoteFavorite(
          QuotesController.getCurrentQuote() as MonkeyTypes.Quote,
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
      const currentQuote = QuotesController.getCurrentQuote();
      return (
        isAuthenticated() &&
        currentQuote !== null &&
        Config.mode === "quote" &&
        QuotesController.isQuoteFavorite(currentQuote)
      );
    },
    exec: async (): Promise<void> => {
      try {
        Loader.show();
        await QuotesController.setQuoteFavorite(
          QuotesController.getCurrentQuote() as MonkeyTypes.Quote,
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
