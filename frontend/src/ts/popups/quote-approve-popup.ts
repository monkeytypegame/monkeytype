import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import format from "date-fns/format";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "quoteApprovePopupWrapper";

interface Quote {
  _id: string;
  text: string;
  source: string;
  language: string;
  timestamp: number;
}

let quotes: Quote[] = [];

function updateList(): void {
  $("#quoteApprovePopupWrapper .quotes").empty();
  quotes.forEach((quote, index) => {
    const quoteEl = $(`
      <div class="quote" id="${index}" dbid="${quote._id}">
        <textarea class="text">${quote.text}</textarea>
        <input type="text" class="source" placeholder="Source" value="${
          quote.source
        }">
        <div class="buttons">
          <div class="textButton disabled undo" aria-label="Undo changes" data-balloon-pos="left"><i class="fas fa-fw fa-undo-alt"></i></div>
          <div class="textButton refuse" aria-label="Refuse quote" data-balloon-pos="left"><i class="fas fa-fw fa-times"></i></div>
          <div class="textButton approve" aria-label="Approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-check"></i></div>
          <div class="textButton edit hidden" aria-label="Edit and approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-pen"></i></div>
        </div>
        <div class="bottom">
          <div class="length ${
            quote.text.length < 60 ? "red" : ""
          }">Quote length: ${quote.text.length}</div>
          <div class="language">Language: ${quote.language}</div>
          <div class="timestamp">Submitted on: ${format(
            new Date(quote.timestamp),
            "dd MMM yyyy HH:mm"
          )}</div>
        </div>
      </div>
    `);
    $("#quoteApprovePopupWrapper .quotes").append(quoteEl);
  });
}

function updateQuoteLength(index: number): void {
  const len = (
    $(`#quoteApprovePopup .quote[id=${index}] .text`).val() as string
  )?.length;
  $(`#quoteApprovePopup .quote[id=${index}] .length`).text(
    "Quote length: " + len
  );
  if (len < 60) {
    $(`#quoteApprovePopup .quote[id=${index}] .length`).addClass("red");
  } else {
    $(`#quoteApprovePopup .quote[id=${index}] .length`).removeClass("red");
  }
}

async function getQuotes(): Promise<void> {
  Loader.show();
  const response = await Ape.quotes.get();
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add(
      "Failed to get new quotes: " + response.message,
      -1
    );
  }

  quotes = response.data;
  updateList();
}

export async function show(noAnim = false): Promise<void> {
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    quotes = [];
    getQuotes();
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 125);
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#quoteApprovePopupWrapper").addClass("hidden");
          $("#quoteApprovePopupWrapper .quotes").empty();
          Skeleton.remove(wrapperId);
        }
      );
  }
}

function resetButtons(target: string): void {
  $(target).closest(".quote").find(".textButton").removeClass("disabled");
  if ($(target).closest(".quote").find(".edit").hasClass("hidden")) {
    $(target).closest(".quote").find(".undo").addClass("disabled");
  }
}

$("#quoteApprovePopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteApprovePopupWrapper") {
    hide();
  }
});

$("#quoteApprovePopupWrapper .button.refreshList").on("click", () => {
  $("#quoteApprovePopupWrapper .quotes").empty();
  getQuotes();
});

$("#popups").on("click", "#quoteApprovePopup .quote .undo", async (e) => {
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  $(`#quoteApprovePopup .quote[id=${index}] .text`).val(
    quotes[index]?.text ?? ""
  );
  $(`#quoteApprovePopup .quote[id=${index}] .source`).val(
    quotes[index]?.source ?? ""
  );
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).addClass("disabled");
  $(`#quoteApprovePopup .quote[id=${index}] .approve`).removeClass("hidden");
  $(`#quoteApprovePopup .quote[id=${index}] .edit`).addClass("hidden");
  updateQuoteLength(index);
});

$("#popups").on("click", "#quoteApprovePopup .quote .approve", async (e) => {
  if (!confirm("Are you sure?")) return;
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  const dbid = $(e.target).closest(".quote").attr("dbid") as string;
  const target = e.target;
  $(target).closest(".quote").find(".textButton").addClass("disabled");
  $(target).closest(".quote").find("textarea, input").prop("disabled", true);

  Loader.show();
  const response = await Ape.quotes.approveSubmission(dbid);
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
    return Notifications.add(
      "Failed to approve quote: " + response.message,
      -1
    );
  }

  Notifications.add("Quote approved. " + response.message ?? "", 1);
  quotes.splice(index, 1);
  updateList();
});

$("#popups").on("click", "#quoteApprovePopup .quote .refuse", async (e) => {
  if (!confirm("Are you sure?")) return;
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  const dbid = $(e.target).closest(".quote").attr("dbid") as string;
  const target = e.target;
  $(target).closest(".quote").find(".textButton").addClass("disabled");
  $(target).closest(".quote").find("textarea, input").prop("disabled", true);

  Loader.show();
  const response = await Ape.quotes.rejectSubmission(dbid);
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
    return Notifications.add("Failed to refuse quote: " + response.message, -1);
  }

  Notifications.add("Quote refused.", 1);
  quotes.splice(index, 1);
  updateList();
});

$("#popups").on("click", "#quoteApprovePopup .quote .edit", async (e) => {
  if (!confirm("Are you sure?")) return;
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  const dbid = $(e.target).closest(".quote").attr("dbid") as string;
  const editText = $(
    `#quoteApprovePopup .quote[id=${index}] .text`
  ).val() as string;
  const editSource = $(
    `#quoteApprovePopup .quote[id=${index}] .source`
  ).val() as string;
  const target = e.target;
  $(target).closest(".quote").find(".textButton").addClass("disabled");
  $(target).closest(".quote").find("textarea, input").prop("disabled", true);

  Loader.show();
  const response = await Ape.quotes.approveSubmission(
    dbid,
    editText,
    editSource
  );
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
    return Notifications.add(
      "Failed to approve quote: " + response.message,
      -1
    );
  }

  Notifications.add("Quote edited and approved. " + response.message ?? "", 1);
  quotes.splice(index, 1);
  updateList();
});

$(document).on("input", "#quoteApprovePopup .quote .text", async (e) => {
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).removeClass("disabled");
  $(`#quoteApprovePopup .quote[id=${index}] .approve`).addClass("hidden");
  $(`#quoteApprovePopup .quote[id=${index}] .edit`).removeClass("hidden");
  updateQuoteLength(index);
});

$(document).on("input", "#quoteApprovePopup .quote .source", async (e) => {
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).removeClass("disabled");
  $(`#quoteApprovePopup .quote[id=${index}] .approve`).addClass("hidden");
  $(`#quoteApprovePopup .quote[id=${index}] .edit`).removeClass("hidden");
});

Skeleton.save(wrapperId);
