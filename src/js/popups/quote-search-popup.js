import * as Misc from "./misc";
import * as Notifications from "./notifications";
import Config, * as UpdateConfig from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as TestLogic from "./test-logic";
import * as QuoteSubmitPopup from "./quote-submit-popup";
import * as QuoteApprovePopup from "./quote-approve-popup";
import * as DB from "./db";
import * as TestUI from "./test-ui";

export let selectedId = 1;

async function updateResults(searchText) {
  let quotes = await Misc.getQuotes(Config.language);
  let reg = new RegExp(searchText, "i");
  let found = [];
  quotes.quotes.forEach((quote) => {
    let quoteText = quote["text"].replace(/[.,'"/#!$%^&*;:{}=\-_`~()]/g, "");
    let test1 = reg.test(quoteText);
    if (test1) {
      found.push(quote);
    }
  });
  quotes.quotes.forEach((quote) => {
    let quoteSource = quote["source"].replace(
      /[.,'"/#!$%^&*;:{}=\-_`~()]/g,
      ""
    );
    let quoteId = quote["id"];
    let test2 = reg.test(quoteSource);
    let test3 = reg.test(quoteId);
    if ((test2 || test3) && found.filter((q) => q.id == quote.id).length == 0) {
      found.push(quote);
    }
  });
  $("#quoteSearchResults").remove();
  $("#quoteSearchPopup").append(
    '<div class="quoteSearchResults" id="quoteSearchResults"></div>'
  );
  let resultsList = $("#quoteSearchResults");
  let resultListLength = 0;

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
        <div class="id"><div class="sub">id</div>${quote.id}</div>
        <div class="length"><div class="sub">length</div>${lengthDesc}</div>
        <div class="source"><div class="sub">source</div>${quote.source}</div>
        <div class="resultChevron"><i class="fas fa-chevron-right"></i></div>
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

export async function show() {
  if ($("#quoteSearchPopupWrapper").hasClass("hidden")) {
    $("#quoteSearchPopup input").val("");

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
      .animate({ opacity: 1 }, 100, (e) => {
        $("#quoteSearchPopup input").focus().select();
        updateResults("");
      });
  }
}

export function hide(noAnim = false) {
  if (!$("#quoteSearchPopupWrapper").hasClass("hidden")) {
    $("#quoteSearchPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 100,
        (e) => {
          $("#quoteSearchPopupWrapper").addClass("hidden");
          TestUI.focusWords();
        }
      );
  }
}

function apply(val) {
  if (isNaN(val)) {
    val = document.getElementById("searchBox").value;
  }
  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setQuoteLength(-2, false);
    selectedId = val;
    ManualRestart.set();
    TestLogic.restart();
  } else {
    Notifications.add("Quote ID must be at least 1", 0);
  }
  hide();
}

$("#quoteSearchPopup .searchBox").keydown((e) => {
  if (e.code == "Escape") return;
  setTimeout(() => {
    let searchText = document.getElementById("searchBox").value;
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

$(document).on(
  "click",
  "#quoteSearchPopup #quoteSearchResults .searchResult",
  (e) => {
    selectedId = parseInt($(e.currentTarget).attr("id"));
    apply(selectedId);
  }
);

$(document).on("click", "#quoteSearchPopup #gotoSubmitQuoteButton", (e) => {
  hide(true);
  QuoteSubmitPopup.show(true);
});

$(document).on("click", "#quoteSearchPopup #goToApproveQuotes", (e) => {
  hide(true);
  QuoteApprovePopup.show(true);
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
