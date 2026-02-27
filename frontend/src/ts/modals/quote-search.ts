import Config, { setConfig } from "../config";
import * as DB from "../db";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as Notifications from "../elements/notifications";
import * as QuoteSubmitPopup from "./quote-submit";
import * as QuoteApprovePopup from "./quote-approve";
import * as QuoteFilterPopup from "./quote-filter";
import * as QuoteReportModal from "./quote-report";
import {
  buildSearchService,
  SearchService,
  TextExtractor,
} from "../utils/search-service";
import QuotesController, { Quote } from "../controllers/quotes-controller";
import { isAuthenticated } from "../firebase";
import { debounce } from "throttle-debounce";
import Ape from "../ape";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import SlimSelect from "slim-select";
import * as TestState from "../test/test-state";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as TestLogic from "../test/test-logic";
import { createErrorMessage } from "../utils/misc";
import { highlightMatches } from "../utils/strings";
import { getLanguage } from "../utils/json-data";
import { qsr, ElementWithUtils } from "../utils/dom";

const searchServiceCache: Record<string, SearchService<Quote>> = {};

const pageSize = 100;
let currentPageNumber = 1;
let usingCustomLength = true;
let dataBalloonDirection = "left";
let quotes: Quote[];

async function updateQuotes(): Promise<void> {
  ({ quotes } = await QuotesController.getQuotes(Config.language));
}

async function updateTooltipDirection(): Promise<void> {
  const quotesLanguage = await getLanguage(Config.language);
  const quotesLanguageIsRTL = quotesLanguage?.rightToLeft ?? false;
  dataBalloonDirection = quotesLanguageIsRTL ? "right" : "left";
}

function getSearchService<T>(
  language: string,
  data: T[],
  textExtractor: TextExtractor<T>,
): SearchService<T> {
  if (language in searchServiceCache) {
    return searchServiceCache[language] as unknown as SearchService<T>;
  }

  const newSearchService = buildSearchService<T>(data, textExtractor);
  searchServiceCache[language] =
    newSearchService as unknown as (typeof searchServiceCache)[typeof language];

  return newSearchService;
}

function applyQuoteLengthFilter(quotes: Quote[]): Quote[] {
  if (!modal.isOpen()) return [];
  const quoteLengthDropdown = modal
    .getModal()
    .qs<HTMLSelectElement>("select.quoteLengthFilter");
  const selectedOptions = quoteLengthDropdown
    ? Array.from(quoteLengthDropdown.native.selectedOptions)
    : [];
  const quoteLengthFilterValue = selectedOptions.map((el) => el.value);

  if (quoteLengthFilterValue.length === 0) {
    usingCustomLength = true;
    return quotes;
  }

  const quoteLengthFilter = new Set(
    quoteLengthFilterValue.map((filterValue) => parseInt(filterValue, 10)),
  );

  const customFilterIndex = quoteLengthFilterValue.indexOf("4");

  if (customFilterIndex !== -1) {
    if (QuoteFilterPopup.removeCustom) {
      QuoteFilterPopup.setRemoveCustom(false);
      const selectElement = quoteLengthDropdown?.native as
        | HTMLSelectElement
        | null
        | undefined;

      if (!selectElement) {
        return quotes;
      }

      //@ts-expect-error SlimSelect adds slim to the element
      const ss = selectElement.slim as SlimSelect | undefined;

      if (ss !== undefined) {
        const currentSelected = ss.getSelected();

        // remove custom selection
        const customIndex = currentSelected.indexOf("4");
        if (customIndex > -1) {
          currentSelected.splice(customIndex, 1);
        }

        ss.setSelected(currentSelected);
      }
    } else {
      if (usingCustomLength) {
        QuoteFilterPopup.quoteFilterModal.show(undefined, {});
        usingCustomLength = false;
      } else {
        const filteredQuotes = quotes.filter(
          (quote) =>
            (quote.length >= QuoteFilterPopup.minFilterLength &&
              quote.length <= QuoteFilterPopup.maxFilterLength) ||
            quoteLengthFilter.has(quote.group),
        );

        return filteredQuotes;
      }
    }
  } else {
    usingCustomLength = true;
  }

  const filteredQuotes = quotes.filter((quote) =>
    quoteLengthFilter.has(quote.group),
  );

  return filteredQuotes;
}

function applyQuoteFavFilter(quotes: Quote[]): Quote[] {
  if (!modal.isOpen()) return [];
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
  matchedSearchTerms: string[],
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
    }" aria-label="Report quote" data-balloon-pos=${dataBalloonDirection}>
      <i class="fas fa-flag report"></i>
    </div>

    <div class="textButton favorite ${
      loggedOut && "hidden"
    }" aria-label="Favorite quote" data-balloon-pos=${dataBalloonDirection}>
      <i class="${isFav ? "fas" : "far"} fa-heart favorite"></i>
    </div>

  </div>
  `;
}

function exactSearch(quotes: Quote[], captured: RegExp[]): [Quote[], string[]] {
  const matches: Quote[] = [];
  const exactSearchQueryTerms: Set<string> = new Set<string>();

  for (const quote of quotes) {
    const textAndSource = quote.text + quote.source;
    const currentMatches = [];
    let noMatch = false;

    for (const regex of captured) {
      const match = textAndSource.match(regex);

      if (!match) {
        noMatch = true;
        break;
      }

      currentMatches.push(match[0]);
    }

    if (!noMatch) {
      currentMatches.forEach((match) => exactSearchQueryTerms.add(match));
      matches.push(quote);
    }
  }

  return [matches, Array.from(exactSearchQueryTerms)];
}

async function updateResults(searchText: string): Promise<void> {
  if (!modal.isOpen()) return;

  if (quotes === undefined) {
    ({ quotes } = await QuotesController.getQuotes(Config.language));
  }

  let matches: Quote[] = [];
  let matchedQueryTerms: string[] = [];
  let exactSearchMatches: Quote[] = [];
  let exactSearchMatchedQueryTerms: string[] = [];

  const quotationsRegex = /"(.*?)"/g;
  const exactSearchQueries = Array.from(searchText.matchAll(quotationsRegex));
  const removedSearchText = searchText.replaceAll(quotationsRegex, "");

  if (exactSearchQueries[0]) {
    const searchQueriesRaw = exactSearchQueries.map(
      (query) => new RegExp(query[1] ?? "", "i"),
    );

    [exactSearchMatches, exactSearchMatchedQueryTerms] = exactSearch(
      quotes,
      searchQueriesRaw,
    );
  }

  const quoteSearchService = getSearchService<Quote>(
    Config.language,
    quotes,
    (quote: Quote) => {
      return `${quote.text} ${quote.id} ${quote.source}`;
    },
  );

  if (exactSearchMatches.length > 0 || removedSearchText === searchText) {
    const ids = exactSearchMatches.map((match) => match.id);

    ({ results: matches, matchedQueryTerms } = quoteSearchService.query(
      removedSearchText,
      ids,
    ));

    exactSearchMatches.forEach((match) => {
      if (!matches.includes(match)) matches.push(match);
    });

    matchedQueryTerms = [...exactSearchMatchedQueryTerms, ...matchedQueryTerms];
  }

  const quotesToShow = applyQuoteLengthFilter(
    applyQuoteFavFilter(searchText === "" ? quotes : matches),
  );

  const resultsList = qsr("#quoteSearchResults");
  resultsList.empty();

  const totalPages = Math.ceil(quotesToShow.length / pageSize);

  if (currentPageNumber >= totalPages) {
    qsr("#quoteSearchPageNavigator .nextPage").disable();
  } else {
    qsr("#quoteSearchPageNavigator .nextPage").enable();
  }

  if (currentPageNumber <= 1) {
    qsr("#quoteSearchPageNavigator .prevPage").disable();
  } else {
    qsr("#quoteSearchPageNavigator .prevPage").enable();
  }

  if (quotesToShow.length === 0) {
    modal.getModal().qsr(".pageInfo").setHtml("No search results");
    return;
  }

  const startIndex = (currentPageNumber - 1) * pageSize;
  const endIndex = Math.min(currentPageNumber * pageSize, quotesToShow.length);

  modal
    .getModal()
    .qsr(".pageInfo")
    .setHtml(`${startIndex + 1} - ${endIndex} of ${quotesToShow.length}`);

  quotesToShow.slice(startIndex, endIndex).forEach((quote) => {
    const quoteSearchResult = buildQuoteSearchResult(quote, matchedQueryTerms);
    resultsList.appendHtml(quoteSearchResult);
  });

  const searchResults = modal.getModal().qsa(".searchResult");
  searchResults.qs(".textButton.favorite")?.on("click", (e) => {
    e.stopPropagation();
    const quoteId = parseInt(
      (e.currentTarget as HTMLElement)?.closest<HTMLElement>(".searchResult")
        ?.dataset?.["quoteId"] as string,
    );
    if (quoteId === undefined || isNaN(quoteId)) {
      Notifications.add(
        "Could not toggle quote favorite: quote id is not a number",
        -1,
      );
      return;
    }
    void toggleFavoriteForQuote(`${quoteId}`);
  });
  searchResults.qs(".textButton.report")?.on("click", (e) => {
    e.stopPropagation();
    const quoteId = parseInt(
      (e.currentTarget as HTMLElement)?.closest<HTMLElement>(".searchResult")
        ?.dataset?.["quoteId"] as string,
    );
    if (quoteId === undefined || isNaN(quoteId)) {
      Notifications.add(
        "Could not open quote report modal: quote id is not a number",
        -1,
      );
      return;
    }
    void QuoteReportModal.show(quoteId, {
      modalChain: modal,
    });
  });
  searchResults.on("click", (e) => {
    const quoteId = parseInt(
      (e.currentTarget as HTMLElement)?.closest<HTMLElement>(".searchResult")
        ?.dataset?.["quoteId"] as string,
    );
    TestState.setSelectedQuoteId(quoteId);
    apply(quoteId);
  });
}

let lengthSelect: SlimSelect | undefined = undefined;

export async function show(showOptions?: ShowOptions): Promise<void> {
  void modal.show({
    ...showOptions,
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      if (!isAuthenticated()) {
        modalEl.qsr(".goToQuoteSubmit").hide();
        modalEl.qsr(".toggleFavorites").hide();
      } else {
        modalEl.qsr(".goToQuoteSubmit").show();
        modalEl.qsr(".toggleFavorites").show();
      }

      const quoteMod = DB.getSnapshot()?.quoteMod;
      const isQuoteMod =
        quoteMod !== undefined &&
        (quoteMod === true || (quoteMod as string) !== "");

      if (isQuoteMod) {
        modalEl.qsr(".goToQuoteApprove").show();
      } else {
        modalEl.qsr(".goToQuoteApprove").hide();
      }

      lengthSelect = new SlimSelect({
        select: "#quoteSearchModal .quoteLengthFilter",

        settings: {
          showSearch: false,
          placeholderText: "filter by length",
          contentLocation: modal.getModal().native,
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
          {
            text: "custom",
            value: "4",
          },
        ],
      });
    },
    afterAnimation: async () => {
      await updateTooltipDirection();
      await updateQuotes();
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function apply(val: number): void {
  if (isNaN(val)) {
    val = parseInt(
      (document.getElementById("searchBox") as HTMLInputElement).value,
    );
  }
  if (val !== null && !isNaN(val) && val >= 0) {
    setConfig("quoteLength", [-2]);
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
  if (!modal.isOpen()) return;
  const searchText = (document.getElementById("searchBox") as HTMLInputElement)
    .value;
  currentPageNumber = 1;
  void updateResults(searchText);
});

async function toggleFavoriteForQuote(quoteId: string): Promise<void> {
  const quoteLang = Config.language;

  if (quoteLang === undefined || quoteId === "") {
    Notifications.add("Could not get quote stats!", -1);
    return;
  }

  const quote = {
    language: quoteLang,
    id: parseInt(quoteId, 10),
  } as Quote;

  const alreadyFavorited = QuotesController.isQuoteFavorite(quote);

  const button = modal
    .getModal()
    .qsr(`.searchResult[data-quote-id="${quoteId}"] .textButton.favorite i`);
  const dbSnapshot = DB.getSnapshot();
  if (!dbSnapshot) return;

  if (alreadyFavorited) {
    try {
      showLoaderBar();
      await QuotesController.setQuoteFavorite(quote, false);
      hideLoaderBar();
      button.removeClass("fas").addClass("far");
    } catch (e) {
      hideLoaderBar();
      const message = createErrorMessage(
        e,
        "Failed to remove quote from favorites",
      );
      Notifications.add(message, -1);
    }
  } else {
    try {
      showLoaderBar();
      await QuotesController.setQuoteFavorite(quote, true);
      hideLoaderBar();
      button.removeClass("far").addClass("fas");
    } catch (e) {
      hideLoaderBar();
      const message = createErrorMessage(e, "Failed to add quote to favorites");
      Notifications.add(message, -1);
    }
  }
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs(".searchBox")?.on("input", (e) => {
    searchForQuotes();
  });
  modalEl.qs("button.toggleFavorites")?.on("click", (e) => {
    if (!isAuthenticated()) {
      // Notifications.add("You need to be logged in to use this feature!", 0);
      return;
    }

    (e.currentTarget as HTMLElement)?.classList.toggle("active");
    searchForQuotes();
  });
  modalEl.qs(".goToQuoteApprove")?.on("click", (e) => {
    void QuoteApprovePopup.show({
      modalChain: modal,
    });
  });
  modalEl.qs(".goToQuoteSubmit")?.on("click", async (e) => {
    showLoaderBar();
    const getSubmissionEnabled = await Ape.quotes.isSubmissionEnabled();
    const isSubmissionEnabled =
      (getSubmissionEnabled.status === 200 &&
        getSubmissionEnabled.body.data?.isEnabled) ??
      false;
    hideLoaderBar();
    if (!isSubmissionEnabled) {
      Notifications.add(
        "Quote submission is disabled temporarily due to a large submission queue.",
        0,
        {
          duration: 5,
        },
      );
      return;
    }
    void QuoteSubmitPopup.show({
      modalChain: modal,
    });
  });
  modalEl.qs(".quoteLengthFilter")?.on("change", searchForQuotes);
  modalEl.qs(".nextPage")?.on("click", () => {
    const searchText = (
      document.getElementById("searchBox") as HTMLInputElement
    ).value;
    currentPageNumber++;
    void updateResults(searchText);
  });
  modalEl.qs(".prevPage")?.on("click", () => {
    const searchText = (
      document.getElementById("searchBox") as HTMLInputElement
    ).value;
    currentPageNumber--;
    void updateResults(searchText);
  });

  document?.addEventListener("refresh", () => {
    const searchText = (
      document.getElementById("searchBox") as HTMLInputElement
    ).value;
    void updateResults(searchText);
  });
}

async function cleanup(): Promise<void> {
  lengthSelect?.destroy();
  lengthSelect = undefined;
}

const modal = new AnimatedModal({
  dialogId: "quoteSearchModal",
  setup,
  cleanup,
});
