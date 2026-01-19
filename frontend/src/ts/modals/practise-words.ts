import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as PractiseWords from "../test/practise-words";
import * as TestLogic from "../test/test-logic";
import { ElementWithUtils } from "../utils/dom";

type State = {
  missed: "off" | "words" | "biwords";
  slow: boolean;
};

const state: State = {
  missed: "words",
  slow: false,
};

function updateUI(): void {
  const modalEl = modal.getModal();
  modalEl.qsa(`.group[data-id="missed"] button`).removeClass("active");
  modalEl
    .qs(`.group[data-id="missed"] button[value="${state.missed}"]`)
    ?.addClass("active");

  modalEl.qsa(`.group[data-id="slow"] button`).removeClass("active");
  modalEl
    .qs(`.group[data-id="slow"] button[value="${state.slow}"]`)
    ?.addClass("active");

  if (state.missed === "off" && !state.slow) {
    modalEl.qs(`.start`)?.disable();
  } else {
    modalEl.qs(`.start`)?.enable();
  }
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qsa(".group[data-id='missed'] button").on("click", (e) => {
    state.missed = (e.currentTarget as HTMLButtonElement).value as
      | "off"
      | "words"
      | "biwords";
    updateUI();
  });

  modalEl.qsa(".group[data-id='slow'] button").on("click", (e) => {
    state.slow = (e.currentTarget as HTMLButtonElement).value === "true";
    updateUI();
  });

  modalEl.qs(".start")?.on("click", () => {
    apply();
  });

  modalEl.on("submit", (e) => {
    e.preventDefault();
    apply();
  });

  updateUI();
}

export function show(showOptions?: ShowOptions): void {
  void modal.show(showOptions);
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function apply(): void {
  PractiseWords.init(state.missed, state.slow);
  hide(true);
  TestLogic.restart({
    practiseMissed: true,
  });
}

const modal = new AnimatedModal({
  dialogId: "practiseWordsModal",
  setup,
});
