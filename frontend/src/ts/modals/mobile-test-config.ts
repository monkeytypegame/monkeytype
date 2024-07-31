import * as TestLogic from "../test/test-logic";
import Config, * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomWordAmountPopup from "./custom-word-amount";
import * as CustomTestDurationPopup from "./custom-test-duration";
import * as QuoteSearchModal from "./quote-search";
import * as CustomTextPopup from "./custom-text";
import AnimatedModal from "../utils/animated-modal";
import { QuoteLength } from "@monkeytype/contracts/schemas/configs";
import { Mode } from "@monkeytype/contracts/schemas/shared";

function update(): void {
  const el = $("#mobileTestConfigModal");
  el.find("button").removeClass("active");

  el.find(`.modeGroup button[data-mode='${Config.mode}']`).addClass("active");
  el.find(".timeGroup").addClass("hidden");
  el.find(".wordsGroup").addClass("hidden");
  el.find(".quoteGroup").addClass("hidden");
  el.find(".customGroup").addClass("hidden");
  el.find(`.${Config.mode}Group`).removeClass("hidden");

  if (Config.punctuation) {
    el.find(".punctuation").addClass("active");
  } else {
    el.find(".punctuation").removeClass("active");
  }

  if (Config.numbers) {
    el.find(".numbers").addClass("active");
  } else {
    el.find(".numbers").removeClass("active");
  }

  if (Config.mode === "time") {
    el.find(`.timeGroup button[data-time='${Config.time}']`).addClass("active");
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  } else if (Config.mode === "words") {
    el.find(`.wordsGroup button[data-words='${Config.words}']`).addClass(
      "active"
    );
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  } else if (Config.mode === "quote") {
    for (const ql of Config.quoteLength) {
      el.find(`.quoteGroup button[data-quoteLength='${ql}']`).addClass(
        "active"
      );
    }
    el.find(".punctuation").addClass("disabled");
    el.find(".numbers").addClass("disabled");
  } else if (Config.mode === "zen") {
    el.find(".punctuation").addClass("disabled");
    el.find(".numbers").addClass("disabled");
  } else if (Config.mode === "custom") {
    el.find(".punctuation").removeClass("disabled");
    el.find(".numbers").removeClass("disabled");
  }
}

export function show(): void {
  void modal.show({
    beforeAnimation: async () => {
      update();
    },
  });
}

// function hide(): void {
//   void modal.hide();
// }

async function setup(modalEl: HTMLElement): Promise<void> {
  const wordsGroupButtons = modalEl.querySelectorAll(".wordsGroup button");
  for (const button of wordsGroupButtons) {
    button.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const wrd = target.getAttribute("data-words") as string;

      if (wrd === "custom") {
        CustomWordAmountPopup.show({
          modalChain: modal,
        });
      } else if (wrd !== undefined) {
        const wrdNum = parseInt(wrd);
        UpdateConfig.setWordCount(wrdNum);
        ManualRestart.set();
        TestLogic.restart();
      }
    });
  }

  const modeGroupButtons = modalEl.querySelectorAll(".modeGroup button");
  for (const button of modeGroupButtons) {
    button.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const mode = target.getAttribute("data-mode");
      if (mode === Config.mode) return;
      UpdateConfig.setMode(mode as Mode);
      ManualRestart.set();
      TestLogic.restart();
    });
  }

  const timeGroupButtons = modalEl.querySelectorAll(".timeGroup button");
  for (const button of timeGroupButtons) {
    button.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const time = target.getAttribute("data-time") as string;

      if (time === "custom") {
        CustomTestDurationPopup.show({
          modalChain: modal,
        });
      } else if (time !== undefined) {
        const timeNum = parseInt(time);
        UpdateConfig.setTimeConfig(timeNum);
        ManualRestart.set();
        TestLogic.restart();
      }
    });
  }

  const quoteGroupButtons = modalEl.querySelectorAll(".quoteGroup button");
  for (const button of quoteGroupButtons) {
    button.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const len = parseInt(target.getAttribute("data-quoteLength") ?? "0", 10);

      if (len === -2) {
        void QuoteSearchModal.show({
          modalChain: modal,
        });
      } else {
        let newVal: number[] | number = len;
        if (len === -1) {
          newVal = [0, 1, 2, 3];
        }
        UpdateConfig.setQuoteLength(
          newVal as QuoteLength | QuoteLength[],
          false,
          (e as MouseEvent).shiftKey
        );
        ManualRestart.set();
        TestLogic.restart();
      }
    });
  }

  modalEl.querySelector(".customChange")?.addEventListener("click", () => {
    CustomTextPopup.show({
      modalChain: modal,
    });
  });

  modalEl.querySelector(".punctuation")?.addEventListener("click", () => {
    UpdateConfig.setPunctuation(!Config.punctuation);
    ManualRestart.set();
    TestLogic.restart();
  });

  modalEl.querySelector(".numbers")?.addEventListener("click", () => {
    UpdateConfig.setNumbers(!Config.numbers);
    ManualRestart.set();
    TestLogic.restart();
  });

  const buttons = modalEl.querySelectorAll("button");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      update();
    });
  }
}

const modal = new AnimatedModal({
  dialogId: "mobileTestConfigModal",
  setup,
});
