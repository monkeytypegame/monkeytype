import Config, * as UpdateConfig from "../config";
import * as DB from "../db";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as Notifications from "../elements/notifications";
import * as QuoteSubmitPopup from "./quote-submit";
import * as QuoteApprovePopup from "./quote-approve";
import * as QuoteReportModal from "./quote-report";
import {
  buildSearchService,
  SearchService,
  TextExtractor,
} from "../utils/search-service";
import { splitByAndKeep } from "../utils/strings";
import QuotesController, { Quote } from "../controllers/quotes-controller";
import { isAuthenticated } from "../firebase";
import { debounce } from "throttle-debounce";
import Ape from "../ape";
import * as Loader from "../elements/loader";
import SlimSelect from "slim-select";
import * as TestState from "../test/test-state";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as TestLogic from "../test/test-logic";
import { createErrorMessage } from "../utils/misc";
import { QuoteLength } from "@monkeytype/contracts/schemas/configs";

const searchServiceCache: Record<string, SearchService<Quote>> = {};

const pageSize = 100;
let currentPageNumber = 1;

function getSearchService<T>(
  language: string,
  data: T[],
  textExtractor: TextExtractor<T>
): SearchService<T> {
  if (language in searchServiceCache) {
    return searchServiceCache[language] as unknown as SearchService<T>;
  }

  const newSearchService = buildSearchService<T>(data, textExtractor);
  searchServiceCache[language] =
    newSearchService as unknown as (typeof searchServiceCache)[typeof language];

  return newSearchService;
}

function highlightMatches(text: string, matchedText: string[]): string {
  if (matchedText.length === 0) {
    return text;
  }
  const words = splitByAndKeep(text, `.,"/#!$%^&*;:{}=-_\`~() `.split(""));

  const normalizedWords = words.map((word) => {
    const shouldHighlight =
      matchedText.find((match) => {
        return word.startsWith(match);
      }) !== undefined;
    return shouldHighlight ? `<span class="highlight">${word}</span>` : word;
  });

  return normalizedWords.join("");
}

function applyQuoteLengthFilter(quotes: Quote[]): Quote[] {
  const quoteLengthFilterValue = $(
    "#quoteSearchModal .quoteLengthFilter"
  ).val() as string[];
  if (quoteLengthFilterValue.length === 0) {
    return quotes;
  }

  const quoteLengthFilter = quoteLengthFilterValue.map((filterValue) =>
    parseInt(filterValue, 10)
  );
  const filteredQuotes = quotes.filter((quote) =>
    quoteLengthFilter.includes(quote.group)
  );

  return filteredQuotes;
}

function applyQuoteFavFilter(quotes: Quote[]): Quote[] {
  const showFavOnly = (
    document.querySelector(".toggleFavorites") as HTMLDivElement
  ).classList.contains("active");

  const filteredQuotes = quotes.filter((quote) => {
    if (showFavOnly) {
      return QuotesController.isQuoteFavorite(quote);
    }

    return true;
  });

  return filteredQuotes;
}

function buildQuoteSearchResult(
  quote: Quote,
  matchedSearchTerms: string[]
): string {
  let lengthDesc;
  if (quote.length < 101) {
    lengthDesc = "short";
  } else if (quote.length < 301) {
    lengthDesc = "medium";
  } else if (quote.length < 601) {
    lengthDesc = "long";
  } else {
    lengthDesc = "thicc";
  }

  const loggedOut = !isAuthenticated();
  const isFav = !loggedOut && QuotesController.isQuoteFavorite(quote);

  return `
  <div class="searchResult" data-quote-id="${quote.id}">

    <div class="text">
      ${highlightMatches(quote.text, matchedSearchTerms)}
    </div>

    <div class="id">
      <div class="sub">id</div>
      <span class="quote-id">
        ${highlightMatches(quote.id.toString(), matchedSearchTerms)}
      </span>
    </div>

    <div class="length">
      <div class="sub">length</div>
      ${lengthDesc}
    </div>

    <div class="source">
      <div class="sub">source</div>
      ${highlightMatches(quote.source, matchedSearchTerms)}
    </div>

    <div class="textButton report ${
      loggedOut && "hidden"
    }" aria-label="Report quote" data-balloon-pos="left">
      <i class="fas fa-flag report"></i>
    </div>

    <div class="textButton favorite ${
      loggedOut && "hidden"
    }" aria-label="Favorite quote" data-balloon-pos="left">
      <i class="${isFav ? "fas" : "far"} fa-heart favorite"></i>
    </div>

  </div>
  `;
}

async function updateResults(searchText: string): Promise<void> {
  const { quotes } = await QuotesController.getQuotes(Config.language);

  const quoteSearchService = getSearchService<Quote>(
    Config.language,
    quotes,
    (quote: Quote) => {
      return `${quote.text} ${quote.id} ${quote.source}`;
    }
  );
  const { results: matches, matchedQueryTerms } =
    quoteSearchService.query(searchText);

  const quotesToShow = applyQuoteLengthFilter(
    applyQuoteFavFilter(searchText === "" ? quotes : matches)
  );

  const resultsList = $("#quoteSearchResults");
  resultsList.empty();

  const totalPages = Math.ceil(quotesToShow.length / pageSize);

  if (currentPageNumber >= totalPages) {
    $("#quoteSearchPageNavigator .nextPage").prop("disabled", true);
  } else {
    $("#quoteSearchPageNavigator .nextPage").prop("disabled", false);
  }

  if (currentPageNumber <= 1) {
    $("#quoteSearchPageNavigator .prevPage").prop("disabled", true);
  } else {
    $("#quoteSearchPageNavigator .prevPage").prop("disabled", false);
  }

  if (quotesToShow.length === 0) {
    $("#quoteSearchModal  .pageInfo").html("No search results");
    return;
  }

  const startIndex = (currentPageNumber - 1) * pageSize;
  const endIndex = Math.min(currentPageNumber * pageSize, quotesToShow.length);

  $("#quoteSearchModal  .pageInfo").html(
    `${startIndex + 1} - ${endIndex} of ${quotesToShow.length}`
  );

  quotesToShow.slice(startIndex, endIndex).forEach((quote) => {
    const quoteSearchResult = buildQuoteSearchResult(quote, matchedQueryTerms);
    resultsList.append(quoteSearchResult);
  });

  const searchResults = modal
    .getModal()
    .querySelectorAll<HTMLElement>(".searchResult");
  for (const searchResult of searchResults) {
    const quoteId = parseInt(searchResult.dataset["quoteId"] as string);
    searchResult
      .querySelector(".textButton.favorite")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (quoteId === undefined || isNaN(quoteId)) {
          Notifications.add(
            "Could not toggle quote favorite: quote id is not a number",
            -1
          );
          return;
        }
        void toggleFavoriteForQuote(`${quoteId}`);
      });
    searchResult
      .querySelector(".textButton.report")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (quoteId === undefined || isNaN(quoteId)) {
          Notifications.add(
            "Could not open quote report modal: quote id is not a number",
            -1
          );
          return;
        }
        void QuoteReportModal.show(quoteId, {
          modalChain: modal,
        });
      });
    searchResult.addEventListener("click", (e) => {
      TestState.setSelectedQuoteId(quoteId);
      apply(quoteId);
    });
  }
}

let lengthSelect: SlimSelect | undefined = undefined;

export async function show(showOptions?: ShowOptions): Promise<void> {
  void modal.show({
    ...showOptions,
    focusFirstInput: true,
    beforeAnimation: async () => {
      if (!isAuthenticated()) {
        $("#quoteSearchModal .goToQuoteSubmit").addClass("hidden");
        $("#quoteSearchModal .toggleFavorites").addClass("hidden");
      } else {
        $("#quoteSearchModal .goToQuoteSubmit").removeClass("hidden");
        $("#quoteSearchModal .toggleFavorites").removeClass("hidden");
      }

      const isQuoteMod =
        DB.getSnapshot()?.quoteMod !== undefined &&
        (DB.getSnapshot()?.quoteMod === true ||
          DB.getSnapshot()?.quoteMod !== "");

      if (isQuoteMod) {
        $("#quoteSearchModal .goToQuoteApprove").removeClass("hidden");
      } else {
        $("#quoteSearchModal .goToQuoteApprove").addClass("hidden");
      }

      lengthSelect = new SlimSelect({
        select: "#quoteSearchModal .quoteLengthFilter",

        settings: {
          showSearch: false,
          placeholderText: "filter by length",
          contentLocation: modal.getModal(),
        },
        data: [
          {
            text: "short",
            value: "0",
          },
          {
            text: "medium",
            value: "1",
          },
          {
            text: "long",
            value: "2",
          },
          {
            text: "thicc",
            value: "3",
          },
        ],
      });
    },
    afterAnimation: async () => {
      const quoteSearchInputValue = $(
        "#quoteSearchModal input"
      ).val() as string;
      currentPageNumber = 1;

      void updateResults(quoteSearchInputValue);
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
    afterAnimation: async () => {
      lengthSelect?.destroy();
      lengthSelect = undefined;
    },
  });
}

function apply(val: number): void {
  if (isNaN(val)) {
    val = parseInt(
      (document.getElementById("searchBox") as HTMLInputElement).value
    );
  }
  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setQuoteLength(-2 as QuoteLength, false);
    TestState.setSelectedQuoteId(val);
    ManualRestart.set();
  } else {
    Notifications.add("Quote ID must be at least 1", 0);
    return;
  }
  TestLogic.restart();
  hide(true);
}

const searchForQuotes = debounce(250, (): void => {
  const searchText = (document.getElementById("searchBox") as HTMLInputElement)
    .value;
  currentPageNumber = 1;
  void updateResults(searchText);
});

async function toggleFavoriteForQuote(quoteId: string): Promise<void> {
  const quoteLang = Config.language;

  if (quoteLang === "" || quoteId === "") {
    Notifications.add("Could not get quote stats!", -1);
    return;
  }

  const quote = {
    language: quoteLang,
    id: parseInt(quoteId, 10),
  } as Quote;

  const alreadyFavorited = QuotesController.isQuoteFavorite(quote);

  const $button = $(
    `#quoteSearchModal .searchResult[data-quote-id=${quoteId}] .textButton.favorite i`
  );
  const dbSnapshot = DB.getSnapshot();
  if (!dbSnapshot) return;

  if (alreadyFavorited) {
    try {
      Loader.show();
      await QuotesController.setQuoteFavorite(quote, false);
      Loader.hide();
      $button.removeClass("fas").addClass("far");
    } catch (e) {
      Loader.hide();
      const message = createErrorMessage(
        e,
        "Failed to remove quote from favorites"
      );
      Notifications.add(message, -1);
    }
  } else {
    try {
      Loader.show();
      await QuotesController.setQuoteFavorite(quote, true);
      Loader.hide();
      $button.removeClass("far").addClass("fas");
    } catch (e) {
      Loader.hide();
      const message = createErrorMessage(e, "Failed to add quote to favorites");
      Notifications.add(message, -1);
    }
  }
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector(".searchBox")?.addEventListener("input", (e) => {
    searchForQuotes();
  });
  modalEl
    .querySelector("button.toggleFavorites")
    ?.addEventListener("click", (e) => {
      if (!isAuthenticated()) {
        // Notifications.add("You need to be logged in to use this feature!", 0);
        return;
      }

      $(e.target as HTMLElement).toggleClass("active");
      searchForQuotes();
    });
  modalEl.querySelector(".goToQuoteApprove")?.addEventListener("click", (e) => {
    void QuoteApprovePopup.show({
      modalChain: modal,
    });
  });
  modalEl
    .querySelector(".goToQuoteSubmit")
    ?.addEventListener("click", async (e) => {
      Loader.show();
      const getSubmissionEnabled = await Ape.quotes.isSubmissionEnabled();
      const isSubmissionEnabled =
        (getSubmissionEnabled.status === 200 &&
          getSubmissionEnabled.body.data?.isEnabled) ??
        false;
      Loader.hide();
      if (!isSubmissionEnabled) {
        Notifications.add(
          "Quote submission is disabled temporarily due to a large submission queue.",
          0,
          {
            duration: 5,
          }
        );
        return;
      }
      void QuoteSubmitPopup.show({
        modalChain: modal,
      });
    });
  modalEl
    .querySelector(".quoteLengthFilter")
    ?.addEventListener("change", searchForQuotes);
  modalEl.querySelector(".nextPage")?.addEventListener("click", () => {
    const searchText = (
      document.getElementById("searchBox") as HTMLInputElement
    ).value;
    currentPageNumber++;
    void updateResults(searchText);
  });
  modalEl.querySelector(".prevPage")?.addEventListener("click", () => {
    const searchText = (
      document.getElementById("searchBox") as HTMLInputElement
    ).value;
    currentPageNumber--;
    void updateResults(searchText);
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteSearchModal",
  setup,
});
