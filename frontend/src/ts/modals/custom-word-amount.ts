import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import * as TestLogic from "../test/test-logic";
import { showNoticeNotification } from "../states/notifications";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

export function show(showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    focusFirstInput: "focusAndSelect",
    beforeAnimation: async (modalEl) => {
      modalEl.qs<HTMLInputElement>("input")?.setValue(`${Config.words}`);
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function apply(): void {
  const val = parseInt(
    modal.getModal().qs<HTMLInputElement>("input")?.getValue() ?? "",
    10,
  );

  if (val !== null && !isNaN(val) && val >= 0 && isFinite(val)) {
    if (setConfig("words", val)) {
      TestLogic.restart();
      if (val > 2000) {
        showNoticeNotification("Stay safe and take breaks!");
      } else if (val === 0) {
        showNoticeNotification(
          "Infinite words! Make sure to use Bail Out from the command line to save your result.",
          {
            durationMs: 7000,
          },
        );
      }
    }
  } else {
    showNoticeNotification("Custom word amount must be at least 1");
  }

  hide(true);
}

const modal = new AnimatedModal({
  dialogId: "customWordAmountModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.on("submit", (e) => {
      e.preventDefault();
      apply();
    });
  },
});
