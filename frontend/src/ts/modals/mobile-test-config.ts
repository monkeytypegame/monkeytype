import * as TestLogic from "../test/test-logic";
import Config, { setConfig, setQuoteLengthAll } from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomWordAmountPopup from "./custom-word-amount";
import * as CustomTestDurationPopup from "./custom-test-duration";
import * as QuoteSearchModal from "./quote-search";
import * as CustomTextPopup from "./custom-text";
import AnimatedModal from "../utils/animated-modal";
import { QuoteLength, QuoteLengthConfig } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { areUnsortedArraysEqual } from "../utils/arrays";
import * as ShareTestSettingsPopup from "./share-test-settings";
import { qsr } from "../utils/dom";

function update(): void {
  const el = qsr("#mobileTestConfigModal");
  el.qs("button")?.removeClass("active");

  el.qs(`.modeGroup button[data-mode='${Config.mode}']`)?.addClass("active");
  el.qs(".timeGroup")?.hide();
  el.qs(".wordsGroup")?.hide();
  el.qs(".quoteGroup")?.hide();
  el.qs(".customGroup")?.hide();
  el.qs(`.${Config.mode}Group`)?.show();

  if (Config.punctuation) {
    el.qs(".punctuation")?.addClass("active");
  } else {
    el.qs(".punctuation")?.removeClass("active");
  }

  if (Config.numbers) {
    el.qs(".numbers")?.addClass("active");
  } else {
    el.qs(".numbers")?.removeClass("active");
  }

  if (Config.mode === "time") {
    el.qs(`.timeGroup button[data-time='${Config.time}']`)?.addClass("active");
    el.qs(".punctuation")?.enable();
    el.qs(".numbers")?.enable();
  } else if (Config.mode === "words") {
    el.qs(`.wordsGroup button[data-words='${Config.words}']`)?.addClass(
      "active",
    );
    el.qs(".punctuation")?.enable();
    el.qs(".numbers")?.enable();
  } else if (Config.mode === "quote") {
    if (areUnsortedArraysEqual(Config.quoteLength, [0, 1, 2, 3])) {
      el.qs(`.quoteGroup button[data-quoteLength='all']`)?.addClass("active");
    } else {
      for (const ql of Config.quoteLength) {
        el.qs(`.quoteGroup button[data-quoteLength='${ql}']`)?.addClass(
          "active",
        );
      }
    }
    el.qs(".punctuation")?.disable();
    el.qs(".numbers")?.disable();
  } else if (Config.mode === "zen") {
    el.qs(".punctuation")?.disable();
    el.qs(".numbers")?.disable();
  } else if (Config.mode === "custom") {
    el.qs(".punctuation")?.enable();
    el.qs(".numbers")?.enable();
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
        setConfig("words", wrdNum);
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
      setConfig("mode", mode as Mode);
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
        setConfig("time", timeNum);
        ManualRestart.set();
        TestLogic.restart();
      }
    });
  }

  const quoteGroupButtons = modalEl.querySelectorAll(".quoteGroup button");
  for (const button of quoteGroupButtons) {
    button.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const lenAttr = target.getAttribute("data-quoteLength") ?? "0";

      if (lenAttr === "all") {
        if (setQuoteLengthAll()) {
          ManualRestart.set();
          TestLogic.restart();
        }
      } else if (lenAttr === "-2") {
        void QuoteSearchModal.show({
          modalChain: modal,
        });
      } else {
        const len = parseInt(lenAttr, 10) as QuoteLength;
        let arr: QuoteLengthConfig = [];

        if ((e as MouseEvent).shiftKey) {
          arr = [...Config.quoteLength, len];
        } else {
          arr = [len];
        }

        if (setConfig("quoteLength", arr)) {
          ManualRestart.set();
          TestLogic.restart();
        }
      }
    });
  }

  modalEl.querySelector(".customChange")?.addEventListener("click", () => {
    CustomTextPopup.show({
      modalChain: modal,
    });
  });

  modalEl.querySelector(".punctuation")?.addEventListener("click", () => {
    setConfig("punctuation", !Config.punctuation);
    ManualRestart.set();
    TestLogic.restart();
  });

  modalEl.querySelector(".numbers")?.addEventListener("click", () => {
    setConfig("numbers", !Config.numbers);
    ManualRestart.set();
    TestLogic.restart();
  });

  modalEl.querySelector(".shareButton")?.addEventListener("click", () => {
    ShareTestSettingsPopup.show({
      modalChain: modal,
    });
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
