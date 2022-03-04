import * as TestUI from "../test/test-ui";
import Config, * as UpdateConfig from "../config";
import * as DB from "../db";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as Notifications from "../elements/notifications";
import * as QuoteSubmitPopup from "./quote-submit-popup";
import * as QuoteApprovePopup from "./quote-approve-popup";
import * as QuoteReportPopup from "./quote-report-popup";
import * as Misc from "../misc";

export let selectedId = 1;

export function setSelectedId(val: number): void {
  selectedId = val;
}

async function updateResults(searchText: string): Promise<void> {
  const quotes = await Misc.getQuotes(Config.language);
  const reg = new RegExp(searchText, "i");
  const found: MonkeyTypes.Quote[] = [];
  quotes.quotes.forEach((quote) => {
    const quoteText = quote["text"].replace(/[.,'"/#!$%^&*;:{}=\-_`~()]/g, "");
    const test1 = reg.test(quoteText);
    if (test1) {
      found.push(quote);
    }
  });
  quotes.quotes.forEach((quote) => {
    const quoteSource = quote["source"].replace(
      /[.,'"/#!$%^&*;:{}=\-_`~()]/g,
      ""
    );
    const quoteId = quote["id"];
    const test2 = reg.test(quoteSource);
    const test3 = reg.test(quoteId.toString());
    if ((test2 || test3) && found.filter((q) => q.id == quote.id).length == 0) {
      found.push(quote);
    }
  });
  $("#quoteSearchResults").remove();
  $("#quoteSearchPopup").append(
    '<div class="quoteSearchResults" id="quoteSearchResults"></div>'
  );
  const resultsList = $("#quoteSearchResults");
  let resultListLength = 0;

  const isNotAuthed = !firebase.auth().currentUser;

  found.forEach(async (quote) => {
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
    if (resultListLength++ < 100) {
      resultsList.append(`
      <div class="searchResult" id="${quote.id}">
        <div class="text">${quote.text}</div>
        <div class="id"><div class="sub">id</div><span class="quote-id">${
          quote.id
        }</span></div>
        <div class="length"><div class="sub">length</div>${lengthDesc}</div>
        <div class="source"><div class="sub">source</div>${quote.source}</div>
        <div class="icon-button report ${
          isNotAuthed && "hidden"
        }" aria-label="Report quote" data-balloon-pos="left">
          <i class="fas fa-flag report"></i>
        </div>
      </div>
      `);
    }
  });
  if (found.length > 100) {
    $("#extraResults").html(
      found.length +
        " results <span style='opacity: 0.5'>(only showing 100)</span>"
    );
  } else {
    $("#extraResults").html(found.length + " results");
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
          $("#quoteSearchPopup input").focus().select();
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

$("#quoteSearchPopup .searchBox").keydown((e) => {
  if (e.code == "Escape") return;
  setTimeout(() => {
    let searchText = (<HTMLInputElement>document.getElementById("searchBox"))
      .value;
    searchText = searchText
      .replace(/[.,'"/#!$%^&*;:{}=\-_`~()]/g, "")
      .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    updateResults(searchText);
  }, 0.1); //arbitrarily v. small time as it's only to allow text to input before searching
});

$("#quoteSearchPopupWrapper").click((e) => {
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

$(document).keydown((event) => {
  if (
    event.key === "Escape" &&
    !$("#quoteSearchPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});

// $("#quoteSearchPopup input").keypress((e) => {
//   if (e.keyCode == 13) {
//     if (!isNaN(document.getElementById("searchBox").value)) {
//       apply();
//     } else {
//       let results = document.getElementsByClassName("searchResult");
//       if (results.length > 0) {
//         selectedId = parseInt(results[0].getAttribute("id"));
//         apply(selectedId);
//       }
//     }
//   }
// });
