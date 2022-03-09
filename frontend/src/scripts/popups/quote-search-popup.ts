import * as TestUI from "../test/test-ui";
import Config, * as UpdateConfig from "../config";
import * as DB from "../db";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as Notifications from "../elements/notifications";
import * as QuoteSubmitPopup from "./quote-submit-popup";
import * as QuoteApprovePopup from "./quote-approve-popup";
import * as QuoteReportPopup from "./quote-report-popup";
import * as Misc from "../misc";
import {
  buildSearchService,
  SearchService,
  TextExtractor,
} from "../utils/search-service";
import { debounce } from "../utils/debounce";
import { splitByAndKeep } from "../utils/strings";

export let selectedId = 1;

export function setSelectedId(val: number): void {
  selectedId = val;
}

const searchServiceCache: Record<string, SearchService<any>> = {};

function getSearchService<T>(
  language: string,
  data: T[],
  textExtractor: TextExtractor<T>
): SearchService<T> {
  if (language in searchServiceCache) {
    return searchServiceCache[language];
  }

  const newSearchService = buildSearchService<T>(data, textExtractor);
  searchServiceCache[language] = newSearchService;

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

async function updateResults(searchText: string): Promise<void> {
  const { quotes } = await Misc.getQuotes(Config.language);

  const quoteSearchService = getSearchService<MonkeyTypes.Quote>(
    Config.language,
    quotes,
    (quote: MonkeyTypes.Quote) => {
      return `${quote.text} ${quote.id} ${quote.source}`;
    }
  );
  const { results: matches, matchedQueryTerms } =
    quoteSearchService.query(searchText);

  $("#quoteSearchResults").remove();
  $("#quoteSearchPopup").append(
    '<div class="quoteSearchResults" id="quoteSearchResults"></div>'
  );

  const resultsList = $("#quoteSearchResults");
  const isNotAuthed = !firebase.auth().currentUser;

  const quotesToShow = searchText === "" ? quotes : matches;

  quotesToShow.slice(0, 100).forEach((quote) => {
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
    resultsList.append(`
      <div class="searchResult" id="${quote.id}">
        <div class="text">${highlightMatches(
          quote.text,
          matchedQueryTerms
        )}</div>
        <div class="id"><div class="sub">id</div><span class="quote-id">${highlightMatches(
          quote.id.toString(),
          matchedQueryTerms
        )}</span></div>
        <div class="length"><div class="sub">length</div>${lengthDesc}</div>
        <div class="source"><div class="sub">source</div>${highlightMatches(
          quote.source,
          matchedQueryTerms
        )}</div>
        <div class="icon-button report ${
          isNotAuthed && "hidden"
        }" aria-label="Report quote" data-balloon-pos="left">
          <i class="fas fa-flag report"></i>
        </div>
      </div>
      `);
  });
  if (quotesToShow.length > 100) {
    $("#extraResults").html(
      quotesToShow.length +
        " results <span style='opacity: 0.5'>(only showing 100)</span>"
    );
  } else {
    $("#extraResults").html(quotesToShow.length + " results");
  }
}

export async function show(clearText = true): Promise<void> {
  if ($("#quoteSearchPopupWrapper").hasClass("hidden")) {
    if (clearText) {
      $("#quoteSearchPopup input").val("");
    }

    const quoteSearchInputValue = $("#quoteSearchPopup input").val() as string;

    if (!firebase.auth().currentUser) {
      $("#quoteSearchPopup #gotoSubmitQuoteButton").addClass("hidden");
    } else {
      $("#quoteSearchPopup #gotoSubmitQuoteButton").removeClass("hidden");
    }

    if (DB.getSnapshot()?.quoteMod) {
      $("#quoteSearchPopup #goToApproveQuotes").removeClass("hidden");
    } else {
      $("#quoteSearchPopup #goToApproveQuotes").addClass("hidden");
    }

    $("#quoteSearchPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        if (clearText) {
          $("#quoteSearchPopup input").trigger("focus").select();
        }
        updateResults(quoteSearchInputValue);
      });
  }
}

export function hide(noAnim = false, focusWords = true): void {
  if (!$("#quoteSearchPopupWrapper").hasClass("hidden")) {
    $("#quoteSearchPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 100,
        () => {
          $("#quoteSearchPopupWrapper").addClass("hidden");
          if (focusWords) {
            TestUI.focusWords();
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

const debouncedSearch = debounce(updateResults);

$("#quoteSearchPopup .searchBox").on("keyup", (e) => {
  if (e.code === "Escape") return;

  const searchText = (<HTMLInputElement>document.getElementById("searchBox"))
    .value;
  debouncedSearch(searchText);
});

$("#quoteSearchPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "quoteSearchPopupWrapper") {
    hide();
  }
});

$(document).on("click", "#quoteSearchPopup #gotoSubmitQuoteButton", () => {
  hide(true);
  QuoteSubmitPopup.show(true);
});

$(document).on("click", "#quoteSearchPopup #goToApproveQuotes", () => {
  hide(true);
  QuoteApprovePopup.show(true);
});

$(document).on("click", "#quoteSearchPopup .report", async (e) => {
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

$(document).on("click", "#top .config .quoteLength .text-button", (e) => {
  const len = $(e.currentTarget).attr("quoteLength") ?? (0 as number);
  if (len == -2) {
    // UpdateConfig.setQuoteLength(-2, false, e.shiftKey);
    show();
  }
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#quoteSearchPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});
