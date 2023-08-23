import * as TestUI from "../test/test-ui";
import Config, * as UpdateConfig from "../config";
import * as DB from "../db";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as Notifications from "../elements/notifications";
import * as QuoteSubmitPopup from "./quote-submit-popup";
import * as QuoteApprovePopup from "./quote-approve-popup";
import * as QuoteReportPopup from "./quote-report-popup";
import {
  buildSearchService,
  SearchService,
  TextExtractor,
} from "../utils/search-service";
import { splitByAndKeep } from "../utils/strings";
import QuotesController from "../controllers/quotes-controller";
import { Auth } from "../firebase";
import { debounce } from "throttle-debounce";
import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "quoteSearchPopupWrapper";

export let selectedId = 1;

export function setSelectedId(val: number): void {
  selectedId = val;
}

const searchServiceCache: Record<string, SearchService<MonkeyTypes.Quote>> = {};

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
    newSearchService as unknown as typeof searchServiceCache[typeof language];

  return newSearchService;
}

function highlightMatches(text: string, matchedText: string[]): string {
  if (matchedText.length === 0) {
    return text;
  }
  const words = splitByAndKeep(text, `.,"/#!$%^&*;:{}=-_\`~() `.split(""));

  const normalizedWords = words.map((word) => {
    const shouldHighlight = matchedText.find((match) => {
      return word.startsWith(match);
    });
    return shouldHighlight ? `<span class="highlight">${word}</span>` : word;
  });

  return normalizedWords.join("");
}

function applyQuoteLengthFilter(
  quotes: MonkeyTypes.Quote[]
): MonkeyTypes.Quote[] {
  const quoteLengthFilterValue = $(
    "#quoteSearchPopup .quoteLengthFilter"
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

function applyQuoteFavFilter(quotes: MonkeyTypes.Quote[]): MonkeyTypes.Quote[] {
  const showFavOnly = (
    document.querySelector("#toggleShowFavorites") as HTMLDivElement
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
  quote: MonkeyTypes.Quote,
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

  const loggedOut = !Auth?.currentUser;
  const isFav = !loggedOut && QuotesController.isQuoteFavorite(quote);

  return `
  <div class="searchResult" id="${quote.id}">

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

  const quoteSearchService = getSearchService<MonkeyTypes.Quote>(
    Config.language,
    quotes,
    (quote: MonkeyTypes.Quote) => {
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

  quotesToShow.slice(0, 100).forEach((quote) => {
    const quoteSearchResult = buildQuoteSearchResult(quote, matchedQueryTerms);
    resultsList.append(quoteSearchResult);
  });

  const resultsExceededText =
    quotesToShow.length > 100
      ? "<span style='opacity: 0.5'>(only showing 100)</span>"
      : "";
  $("#extraResults").html(
    `${quotesToShow.length} result(s) ${resultsExceededText}`
  );
}

export async function show(clearText = true): Promise<void> {
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    if (clearText) {
      $("#quoteSearchPopup input").val("");
    }

    const quoteSearchInputValue = $("#quoteSearchPopup input").val() as string;

    if (!Auth?.currentUser) {
      $("#quoteSearchPopup #gotoSubmitQuoteButton").addClass("hidden");
      $("#quoteSearchPopup #toggleShowFavorites").addClass("hidden");
    } else {
      $("#quoteSearchPopup #gotoSubmitQuoteButton").removeClass("hidden");
      $("#quoteSearchPopup #toggleShowFavorites").removeClass("hidden");
    }

    if (DB.getSnapshot()?.quoteMod) {
      $("#quoteSearchPopup #goToApproveQuotes").removeClass("hidden");
    } else {
      $("#quoteSearchPopup #goToApproveQuotes").addClass("hidden");
    }

    $("#quoteSearchPopup .quoteLengthFilter").select2({
      placeholder: "Filter by length",
      maximumSelectionLength: Infinity,
      multiple: true,
      width: "100%",
      data: [
        {
          id: 0,
          text: "short",
          selected: false,
        },
        {
          id: 1,
          text: "medium",
          selected: false,
        },
        {
          id: 2,
          text: "long",
          selected: false,
        },
        {
          id: 3,
          text: "thicc",
          selected: false,
        },
      ],
    });

    $("#quoteSearchPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        if (clearText) {
          $("#quoteSearchPopup input").trigger("focus").trigger("select");
        }
        updateResults(quoteSearchInputValue);
      });
  }
}

function hide(noAnim = false, focusWords = true): void {
  if (isPopupVisible(wrapperId)) {
    $("#quoteSearchPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 125,
        () => {
          $("#quoteSearchPopupWrapper").addClass("hidden");

          if (focusWords) {
            TestUI.focusWords();
            $("#quoteSearchPopup .quoteLengthFilter").val([]);
            $("#quoteSearchPopup .quoteLengthFilter").trigger("change");
            Skeleton.remove(wrapperId);
          }
        }
      );
  }
}

export function apply(val: number): boolean {
  if (isNaN(val)) {
    val = parseInt(
      (<HTMLInputElement>document.getElementById("searchBox")).value as string
    );
  }
  let ret;
  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setQuoteLength(-2 as MonkeyTypes.QuoteLength, false);
    selectedId = val;
    ManualRestart.set();
    ret = true;
  } else {
    Notifications.add("Quote ID must be at least 1", 0);
    ret = false;
  }
  hide();
  return ret;
}

const searchForQuotes = debounce(250, (): void => {
  const searchText = (<HTMLInputElement>document.getElementById("searchBox"))
    .value;
  updateResults(searchText);
});

$("#quoteSearchPopupWrapper .searchBox").on("keyup", (e) => {
  if (e.code === "Escape") return;
  searchForQuotes();
});

$("#quoteSearchPopupWrapper .quoteLengthFilter").on("change", searchForQuotes);

$("#quoteSearchPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteSearchPopupWrapper") {
    hide();
  }
});

$("#popups").on(
  "click",
  "#quoteSearchPopup #gotoSubmitQuoteButton",
  async () => {
    Loader.show();
    const isSubmissionEnabled = (await Ape.quotes.isSubmissionEnabled()).data
      .isEnabled;
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
    hide();
    QuoteSubmitPopup.show(true);
  }
);

$("#popups").on("click", "#quoteSearchPopup #goToApproveQuotes", () => {
  hide();
  QuoteApprovePopup.show(true);
});

$("#popups").on("click", "#quoteSearchPopup .report", async (e) => {
  const quoteId = e.target.closest(".searchResult").id;
  const quoteIdSelectedForReport = parseInt(quoteId);

  hide(true, false);
  QuoteReportPopup.show({
    quoteId: quoteIdSelectedForReport,
    noAnim: true,
    previousPopupShowCallback: () => {
      show(false);
    },
  });
});

$("#popups").on(
  "click",
  "#quoteSearchPopup .textButton.favorite",
  async (e) => {
    const quoteLang = Config.language;
    const quoteId = e.target.closest(".searchResult").id as string;

    if (quoteLang === "" || quoteId === "") {
      Notifications.add("Could not get quote stats!", -1);
      return;
    }

    const $button = $(
      `#quoteSearchPopup .searchResult[id=${quoteId}] .textButton.favorite i`
    );
    const dbSnapshot = DB.getSnapshot();
    if (!dbSnapshot) return;

    if ($button.hasClass("fas")) {
      // Remove from favorites
      Loader.show();
      const response = await Ape.users.removeQuoteFromFavorites(
        quoteLang,
        quoteId
      );
      Loader.hide();

      Notifications.add(response.message, response.status === 200 ? 1 : -1);

      if (response.status === 200) {
        $button.removeClass("fas").addClass("far");
        const quoteIndex =
          dbSnapshot.favoriteQuotes[quoteLang]?.indexOf(quoteId);
        dbSnapshot.favoriteQuotes[quoteLang]?.splice(quoteIndex, 1);
      }
    } else {
      // Add to favorites
      Loader.show();
      const response = await Ape.users.addQuoteToFavorites(quoteLang, quoteId);
      Loader.hide();

      Notifications.add(response.message, response.status === 200 ? 1 : -1);

      if (response.status === 200) {
        $button.removeClass("far").addClass("fas");
        if (!dbSnapshot.favoriteQuotes[quoteLang]) {
          dbSnapshot.favoriteQuotes[quoteLang] = [];
        }
        dbSnapshot.favoriteQuotes[quoteLang]?.push(quoteId);
      }
    }
    e.preventDefault();
  }
);

$("#popups").on("click", "#quoteSearchPopup #toggleShowFavorites", (e) => {
  if (!Auth?.currentUser) {
    // Notifications.add("You need to be logged in to use this feature!", 0);
    return;
  }

  $(e.target).toggleClass("active");
  searchForQuotes();
});

$(".pageTest").on("click", "#testConfig .quoteLength .textButton", (e) => {
  const len = parseInt($(e.currentTarget).attr("quoteLength") ?? "0");
  if (len === -2) {
    show();
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
