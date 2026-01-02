import { ElementWithUtils } from "../utils/dom";
import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import { format } from "date-fns/format";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { Quote } from "@monkeytype/schemas/quotes";
import { escapeHTML } from "../utils/misc";
import { qsr, createElementWithUtils, ElementWithUtils } from "../utils/dom";

let quotes: Quote[] = [];

function updateList(): void {
  const modalEl = modal.getModal();
  modalEl.qsr(".quotes").empty();
  quotes.forEach((quote, index) => {
    const quoteEl = createElementWithUtils("div");
    quoteEl.setHtml(`
      <div class="quote" data-id="${index}" data-db-id="${quote._id}">
        <textarea class="text">${escapeHTML(quote.text)}</textarea>
        <input type="text" class="source" placeholder="Source" value="${escapeHTML(
          quote.source,
        )}">
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
            "dd MMM yyyy HH:mm",
          )}</div>
        </div>
      </div>
    `);

    modalEl.qsr(".quotes").append(quoteEl);
    quoteEl.qsr(".source").on("input", () => {
      modalEl.qsr(`.quote[data-id="${index}"] .undo`).enable();
      modalEl.qsr(`.quote[data-id="${index}"] .approve`).hide();
      modalEl.qsr(`.quote[data-id="${index}"] .edit`).show();
    });
    quoteEl.qsr(".text").on("input", () => {
      modalEl.qsr(`.quote[data-id="${index}"] .undo`).enable();
      modalEl.qsr(`.quote[data-id="${index}"] .approve`).hide();
      modalEl.qsr(`.quote[data-id="${index}"] .edit`).show();
      updateQuoteLength(index);
    });
    quoteEl.qsr(".undo").on("click", () => {
      undoQuote(index);
    });
    quoteEl.qsr(".approve").on("click", () => {
      void approveQuote(index, quote._id);
    });
    quoteEl.qsr(".refuse").on("click", () => {
      void refuseQuote(index, quote._id);
    });
    quoteEl.qsr(".edit").on("click", () => {
      void editQuote(index, quote._id);
    });
  });
}

function updateQuoteLength(index: number): void {
  const len = (
    qsr<HTMLTextAreaElement>(
      `#quoteApproveModal .quote[data-id="${index}"] .text`,
    ).getValue() as string
  )?.length;
  qsr(`#quoteApproveModal .quote[data-id="${index}"] .length`).setHtml(
    `<i class="fas fa-fw fa-ruler"></i>${len}`,
  );
  if (len < 60) {
    qsr(`#quoteApproveModal .quote[data-id="${index}"] .length`).addClass(
      "red",
    );
  } else {
    qsr(`#quoteApproveModal .quote[data-id="${index}"] .length`).removeClass(
      "red",
    );
  }
}

async function getQuotes(): Promise<void> {
  Loader.show();
  const response = await Ape.quotes.get();
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to get new quotes", -1, { response });
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
  const quote = qsr(`#quoteApproveModal .quotes .quote[data-id="${index}"]`);
  quote.qsa("button").enable();
  if (quote.qsr(".edit").hasClass("hidden")) {
    quote.qsr(".undo").disable();
  }
}

function undoQuote(index: number): void {
  qsr<HTMLTextAreaElement>(
    `#quoteApproveModal .quote[data-id="${index}"] .text`,
  ).setValue(quotes[index]?.text ?? "");
  qsr<HTMLInputElement>(
    `#quoteApproveModal .quote[data-id="${index}"] .source`,
  ).setValue(quotes[index]?.source ?? "");
  qsr(`#quoteApproveModal .quote[data-id="${index}"] .undo`).disable();
  qsr(`#quoteApproveModal .quote[data-id="${index}"] .approve`).show();
  qsr(`#quoteApproveModal .quote[data-id="${index}"] .edit`).hide();
  updateQuoteLength(index);
}

async function approveQuote(index: number, dbid: string): Promise<void> {
  if (!confirm("Are you sure?")) return;
  const quote = qsr(`#quoteApproveModal .quotes .quote[data-id="${index}"]`);
  quote.qsa("button").disable();
  quote.qsa("textarea, input").disable();

  Loader.show();
  const response = await Ape.quotes.approveSubmission({
    body: { quoteId: dbid },
  });
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(index);
    quote.qsa("textarea, input").enable();
    Notifications.add("Failed to approve quote", -1, { response });
    return;
  }

  Notifications.add(`Quote approved. ${response.body.message ?? ""}`, 1);
  quotes.splice(index, 1);
  updateList();
}

async function refuseQuote(index: number, dbid: string): Promise<void> {
  if (!confirm("Are you sure?")) return;
  const quote = qsr(`#quoteApproveModal .quotes .quote[data-id="${index}"]`);
  quote.qsa("button").disable();
  quote.qsa("textarea, input").disable();

  Loader.show();
  const response = await Ape.quotes.rejectSubmission({
    body: { quoteId: dbid },
  });
  Loader.hide();

  if (response.status !== 200) {
    resetButtons(index);
    quote.qsa("textarea, input").enable();
    Notifications.add("Failed to refuse quote", -1, { response });
    return;
  }

  Notifications.add("Quote refused.", 1);
  quotes.splice(index, 1);
  updateList();
}

async function editQuote(index: number, dbid: string): Promise<void> {
  if (!confirm("Are you sure?")) return;
  const editText = qsr<HTMLTextAreaElement>(
    `#quoteApproveModal .quote[data-id="${index}"] .text`,
  ).getValue() as string;
  const editSource = qsr<HTMLInputElement>(
    `#quoteApproveModal .quote[data-id="${index}"] .source`,
  ).getValue() as string;
  const quote = qsr(`#quoteApproveModal .quotes .quote[data-id="${index}"]`);
  quote.qsa("button").disable();
  quote.qsa("textarea, input").disable();

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
    quote.qsa("textarea, input").enable();
    Notifications.add("Failed to approve quote", -1, { response });
    return;
  }

  Notifications.add(
    `Quote edited and approved. ${response.body.message ?? ""}`,
    1,
  );
  quotes.splice(index, 1);
  updateList();
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs("button.refreshList")?.on("click", () => {
    $("#quoteApproveModal .quotes").empty();
    void getQuotes();
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteApproveModal",
  setup,
});
