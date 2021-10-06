import * as Misc from "./misc";
import * as Notifications from "./notifications";
import Config from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as TestLogic from "./test-logic";
import axiosInstance from "./axios-instance";
import * as Loader from "./loader";

let quotes = [];

function updateList() {
  $("#quoteApprovePopupWrapper .quotes").empty();
  quotes.forEach((quote, index) => {
    let quoteEl = $(`
      <div class="quote" id="${index}">
        <textarea class="text">${quote.text}</textarea>
        <input type="text" class="source" placeholder="Source" value="${
          quote.source
        }">
        <div class="buttons">
          <div class="icon-button disabled undo" aria-label="Undo changes" data-balloon-pos="left"><i class="fas fa-fw fa-undo-alt"></i></div>
          <div class="icon-button refuse" aria-label="Refuse quote" data-balloon-pos="left"><i class="fas fa-fw fa-times"></i></div>
          <div class="icon-button approve" aria-label="Approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-check"></i></div>
          <div class="icon-button edit hidden" aria-label="Edit and approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-pen"></i></div>
        </div>
        <div class="bottom">
          <div class="language">Language: ${quote.language}</div>
          <div class="timestamp">Submitted on: ${moment(quote.timestamp).format(
            "DD MMM YYYY HH:mm"
          )}</div>
        </div>
      </div>
    `);
    $("#quoteApprovePopupWrapper .quotes").append(quoteEl);
  });
}

async function getQuotes() {
  Loader.show();
  let response;
  try {
    response = await axiosInstance.get("/new-quotes/get");
  } catch (e) {
    Loader.hide();
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to get new quotes: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    quotes = response.data;
    updateList();
  }
}

export async function show(noAnim = false) {
  if ($("#quoteApprovePopupWrapper").hasClass("hidden")) {
    quotes = [];
    getQuotes();
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 100, (e) => {});
  }
}

export function hide() {
  if (!$("#quoteApprovePopupWrapper").hasClass("hidden")) {
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#quoteApprovePopupWrapper").addClass("hidden");
          $("#quoteApprovePopupWrapper .quotes").empty();
        }
      );
  }
}

$("#quoteApprovePopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteApprovePopupWrapper") {
    hide();
  }
});

$("#quoteApprovePopupWrapper .button.refreshList").on("click", (e) => {
  getQuotes();
});

$(document).on("click", "#quoteApprovePopup .quote .undo", async (e) => {
  let index = parseInt($(e.target).closest(".quote").attr("id"));
  $(`#quoteApprovePopup .quote[id=${index}] .text`).val(quotes[index].text);
  $(`#quoteApprovePopup .quote[id=${index}] .source`).val(quotes[index].source);
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).addClass("disabled");
});

$(document).on("input", "#quoteApprovePopup .quote .text", async (e) => {
  let index = parseInt($(e.target).closest(".quote").attr("id"));
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).removeClass("disabled");
});

$(document).on("input", "#quoteApprovePopup .quote .source", async (e) => {
  let index = parseInt($(e.target).closest(".quote").attr("id"));
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).removeClass("disabled");
});
