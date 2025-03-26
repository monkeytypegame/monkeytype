import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import { format } from "date-fns/format";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { Quote } from "@monkeytype/contracts/schemas/quotes";

let quotes: Quote[] = [];

function updateList(): void {
  $("#quoteApproveModal .quotes").empty();
  quotes.forEach((quote, index) => {
    const quoteEl = $(`
      <div class="quote" data-id="${index}" data-db-id="${quote._id}">
        <textarea class="text">${quote.text}</textarea>
        <input type="text" class="source" placeholder="Source" value="${
          quote.source
        }">
        <div class="buttons">
          <button disabled class="textButton undo" aria-label="Undo changes" data-balloon-pos="left"><i class="fas fa-fw fa-undo-alt"></i></button>
          <button class="textButton refuse" aria-label="Refuse quote" data-balloon-pos="left"><i class="fas fa-fw fa-times"></i></button>
          <button class="textButton approve" aria-label="Approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-check"></i></button>
          <button class="textButton edit hidden" aria-label="Edit and approve quote" data-balloon-pos="left"><i class="fas fa-fw fa-pen"></i></button>
        </div>
        <div class="bottom">
          <div class="length ${
            quote.text.length < 60 ? "red" : ""
          }"><i class="fas fa-fw fa-ruler"></i>${quote.text.length}</div>
          <div class="language"><i class="fas fa-fw fa-globe-americas"></i>${
            quote.language
          }</div>
          <div class="timestamp"><i class="fas fa-fw fa-calendar"></i>${format(
            new Date(quote.timestamp),
            "dd MMM yyyy HH:mm"
          )}</div>
        </div>
      </div>
    `);
    $("#quoteApproveModal .quotes").append(quoteEl);
    quoteEl.find(".source").on("input", () => {
      $(`#quoteApproveModal .quote[data-id=${index}] .undo`).prop(
        "disabled",
        false
      );
      $(`#quoteApproveModal .quote[data-id=${index}] .approve`).addClass(
        "hidden"
      );
      $(`#quoteApproveModal .quote[data-id=${index}] .edit`).removeClass(
        "hidden"
      );
    });
    quoteEl.find(".text").on("input", () => {
      $(`#quoteApproveModal .quote[data-id=${index}] .undo`).prop(
        "disabled",
        false
      );
      $(`#quoteApproveModal .quote[data-id=${index}] .approve`).addClass(
        "hidden"
      );
      $(`#quoteApproveModal .quote[data-id=${index}] .edit`).removeClass(
        "hidden"
      );
      updateQuoteLength(index);
    });
    quoteEl.find(".undo").on("click", () => {
      undoQuote(index);
    });
    quoteEl.find(".approve").on("click", () => {
      void approveQuote(index, quote._id);
    });
    quoteEl.find(".refuse").on("click", () => {
      void refuseQuote(index, quote._id);
    });
    quoteEl.find(".edit").on("click", () => {
      void editQuote(index, quote._id);
    });
  });
}

function updateQuoteLength(index: number): void {
  const len = (
    $(`#quoteApproveModal .quote[data-id=${index}] .text`).val() as string
  )?.length;
  $(`#quoteApproveModal .quote[data-id=${index}] .length`).html(
    `<i class="fas fa-fw fa-ruler"></i>${len}`
  );
  if (len < 60) {
    $(`#quoteApproveModal .quote[data-id=${index}] .length`).addClass("red");
  } else {
    $(`#quoteApproveModal .quote[data-id=${index}] .length`).removeClass("red");
  }
}

async function getQuotes(): Promise<void> {
  Loader.show();
  const response = await Ape.quotes.get();
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to get new quotes: " + response.body.message, -1);
    return;
  }

  quotes = response.body.data ?? [];
  updateList();
}

export async function show(showOptions?: ShowOptions): Promise<void> {
  void modal.show({
    ...showOptions,
    beforeAnimation: async () => {
      quotes = [];
      void getQuotes();
    },
  });
}

// function hide(clearModalChain = false): void {
//   void modal.hide({
//     clearModalChain
//   })
// }

function resetButtons(index: number): void {
  const quote = $(`#quoteApproveModal .quotes .quote[data-id=${index}]`);
  quote.find("button").prop("disabled", false);
  if (quote.find(".edit").hasClass("hidden")) {
    quote.find(".undo").prop("disabled", true);
  }
}

function undoQuote(index: number): void {
  $(`#quoteApproveModal .quote[data-id=${index}] .text`).val(
    quotes[index]?.text ?? ""
  );
  $(`#quoteApproveModal .quote[data-id=${index}] .source`).val(
    quotes[index]?.source ?? ""
  );
  $(`#quoteApproveModal .quote[data-id=${index}] .undo`).prop("disabled", true);
  $(`#quoteApproveModal .quote[data-id=${index}] .approve`).removeClass(
    "hidden"
  );
  $(`#quoteApproveModal .quote[data-id=${index}] .edit`).addClass("hidden");
  updateQuoteLength(index);
}

async function approveQuote(index: number, dbid: string): Promise<void> {
  if (!confirm("Are you sure?")) return;
  const quote = $(`#quoteApproveModal .quotes .quote[data-id=${index}]`);
  quote.find("button").prop("disabled", true);
  quote.find("textarea, input").prop("disabled", true);

  Loader.show();
  const response = await Ape.quotes.approveSubmission({
    body: { quoteId: dbid },
  });
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(index);
    quote.find("textarea, input").prop("disabled", false);
    Notifications.add("Failed to approve quote: " + response.body.message, -1);
    return;
  }

  Notifications.add(`Quote approved. ${response.body.message ?? ""}`, 1);
  quotes.splice(index, 1);
  updateList();
}

async function refuseQuote(index: number, dbid: string): Promise<void> {
  if (!confirm("Are you sure?")) return;
  const quote = $(`#quoteApproveModal .quotes .quote[data-id=${index}]`);
  quote.find("button").prop("disabled", true);
  quote.find("textarea, input").prop("disabled", true);

  Loader.show();
  const response = await Ape.quotes.rejectSubmission({
    body: { quoteId: dbid },
  });
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(index);
    quote.find("textarea, input").prop("disabled", false);
    Notifications.add("Failed to refuse quote: " + response.body.message, -1);
    return;
  }

  Notifications.add("Quote refused.", 1);
  quotes.splice(index, 1);
  updateList();
}

async function editQuote(index: number, dbid: string): Promise<void> {
  if (!confirm("Are you sure?")) return;
  const editText = $(
    `#quoteApproveModal .quote[data-id=${index}] .text`
  ).val() as string;
  const editSource = $(
    `#quoteApproveModal .quote[data-id=${index}] .source`
  ).val() as string;
  const quote = $(`#quoteApproveModal .quotes .quote[data-id=${index}]`);
  quote.find("button").prop("disabled", true);
  quote.find("textarea, input").prop("disabled", true);

  Loader.show();
  const response = await Ape.quotes.approveSubmission({
    body: {
      quoteId: dbid,
      editText,
      editSource,
    },
  });
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(index);
    quote.find("textarea, input").prop("disabled", false);
    Notifications.add("Failed to approve quote: " + response.body.message, -1);
    return;
  }

  Notifications.add(
    `Quote edited and approved. ${response.body.message ?? ""}`,
    1
  );
  quotes.splice(index, 1);
  updateList();
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector("button.refreshList")?.addEventListener("click", () => {
    $("#quoteApproveModal .quotes").empty();
    void getQuotes();
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteApproveModal",
  setup,
});
