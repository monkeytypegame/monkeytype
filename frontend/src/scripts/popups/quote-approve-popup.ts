// @ts-ignore
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import axiosInstance from "../axios-instance";
import { AxiosError } from "axios";

type Quote = {
  _id: string;
  text: string;
  source: string;
  language: string;
  timestamp: number;
};

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
          <div class="icon-button disabled undo" aria-label="Undo changes" data-balloon-pos="left"><i class="fas fa-fw fa-undo-alt"></i></div>
          <div class="icon-button refuse" aria-label="Refuse quote" data-balloon-pos="left"><i class="fas fa-fw fa-times"></i></div>
          <div class="icon-button approve" aria-label="Approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-check"></i></div>
          <div class="icon-button edit hidden" aria-label="Edit and approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-pen"></i></div>
        </div>
        <div class="bottom">
          <div class="length ${
            quote.text.length < 60 ? "red" : ""
          }">Quote length: ${quote.text.length}</div>
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

function updateQuoteLength(index: number): void {
  const len = ($(
    `#quoteApprovePopup .quote[id=${index}] .text`
  ).val() as string)?.length;
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
  let response;
  try {
    response = await axiosInstance.get("/quotes");
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
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

export async function show(noAnim = false): Promise<void> {
  if ($("#quoteApprovePopupWrapper").hasClass("hidden")) {
    quotes = [];
    getQuotes();
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 100);
  }
}

export function hide(): void {
  if (!$("#quoteApprovePopupWrapper").hasClass("hidden")) {
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#quoteApprovePopupWrapper").addClass("hidden");
          $("#quoteApprovePopupWrapper .quotes").empty();
        }
      );
  }
}

function resetButtons(target: string): void {
  $(target).closest(".quote").find(".icon-button").removeClass("disabled");
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

$(document).on("click", "#quoteApprovePopup .quote .undo", async (e) => {
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  $(`#quoteApprovePopup .quote[id=${index}] .text`).val(quotes[index].text);
  $(`#quoteApprovePopup .quote[id=${index}] .source`).val(quotes[index].source);
  $(`#quoteApprovePopup .quote[id=${index}] .undo`).addClass("disabled");
  $(`#quoteApprovePopup .quote[id=${index}] .approve`).removeClass("hidden");
  $(`#quoteApprovePopup .quote[id=${index}] .edit`).addClass("hidden");
  updateQuoteLength(index);
});

$(document).on("click", "#quoteApprovePopup .quote .approve", async (e) => {
  if (!confirm("Are you sure?")) return;
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  const dbid = $(e.target).closest(".quote").attr("dbid");
  const target = e.target;
  $(target).closest(".quote").find(".icon-button").addClass("disabled");
  $(target).closest(".quote").find("textarea, input").prop("disabled", true);
  Loader.show();
  let response;
  try {
    response = await axiosInstance.post("/quotes/approve", {
      quoteId: dbid,
    });
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to approve quote: " + msg, -1);
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
  } else {
    Notifications.add("Quote approved. " + response.data.message ?? "", 1);
    quotes.splice(index, 1);
    updateList();
  }
});

$(document).on("click", "#quoteApprovePopup .quote .refuse", async (e) => {
  if (!confirm("Are you sure?")) return;
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  const dbid = $(e.target).closest(".quote").attr("dbid");
  const target = e.target;
  $(target).closest(".quote").find(".icon-button").addClass("disabled");
  $(target).closest(".quote").find("textarea, input").prop("disabled", true);
  Loader.show();
  let response;
  try {
    response = await axiosInstance.post("/quotes/reject", {
      quoteId: dbid,
    });
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to refuse quote: " + msg, -1);
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
  } else {
    Notifications.add("Quote refused.", 1);
    quotes.splice(index, 1);
    updateList();
  }
});

$(document).on("click", "#quoteApprovePopup .quote .edit", async (e) => {
  if (!confirm("Are you sure?")) return;
  const index = parseInt($(e.target).closest(".quote").attr("id") as string);
  const dbid = $(e.target).closest(".quote").attr("dbid");
  const editText = $(`#quoteApprovePopup .quote[id=${index}] .text`).val();
  const editSource = $(`#quoteApprovePopup .quote[id=${index}] .source`).val();
  const target = e.target;
  $(target).closest(".quote").find(".icon-button").addClass("disabled");
  $(target).closest(".quote").find("textarea, input").prop("disabled", true);
  Loader.show();
  let response;
  try {
    response = await axiosInstance.post("/quotes/approve", {
      quoteId: dbid,
      editText,
      editSource,
    });
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to approve quote: " + msg, -1);
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
    resetButtons(target);
    $(target).closest(".quote").find("textarea, input").prop("disabled", false);
  } else {
    Notifications.add(
      "Quote edited and approved. " + response.data.message ?? "",
      1
    );
    quotes.splice(index, 1);
    updateList();
  }
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
