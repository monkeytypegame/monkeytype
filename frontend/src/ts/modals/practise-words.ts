import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as PractiseWords from "../test/practise-words";
import * as TestLogic from "../test/test-logic";

type State = {
  missed: "off" | "words" | "biwords";
  slow: boolean;
};

const state: State = {
  missed: "words",
  slow: false,
};

const practiseModal = "#practiseWordsModal .modal";

function updateUI(): void {
  $(`${practiseModal} .group[data-id="missed"] button`).removeClass("active");
  $(
    `${practiseModal} .group[data-id="missed"] button[value="${state.missed}"]`
  ).addClass("active");

  $(`${practiseModal} .group[data-id="slow"] button`).removeClass("active");
  $(
    `${practiseModal} .group[data-id="slow"] button[value="${state.slow}"]`
  ).addClass("active");

  if (state.missed === "off" && !state.slow) {
    $(`${practiseModal} .start`).prop("disabled", true);
  } else {
    $(`${practiseModal} .start`).prop("disabled", false);
  }
}

async function setup(modalEl: HTMLElement): Promise<void> {
  for (const button of modalEl.querySelectorAll(
    ".group[data-id='missed'] button"
  )) {
    button.addEventListener("click", (e) => {
      state.missed = (e.target as HTMLButtonElement).value as
        | "off"
        | "words"
        | "biwords";
      updateUI();
    });
  }

  for (const button of modalEl.querySelectorAll(
    ".group[data-id='slow'] button"
  )) {
    button.addEventListener("click", (e) => {
      state.slow = (e.target as HTMLButtonElement).value === "true";
      updateUI();
    });
  }

  modalEl.querySelector(".start")?.addEventListener("click", () => {
    apply();
  });

  modalEl.addEventListener("submit", (e) => {
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
