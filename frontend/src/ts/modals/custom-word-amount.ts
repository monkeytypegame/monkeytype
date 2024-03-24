import Config, * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Notifications from "../elements/notifications";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

export function show(showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    focusFirstInput: "focusAndSelect",
    beforeAnimation: async (modalEl) => {
      (
        modalEl.querySelector("input") as HTMLInputElement
      ).value = `${Config.words}`;
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
    modal.getModal().querySelector("input")?.value as string,
    10
  );

  if (val !== null && !isNaN(val) && val >= 0 && isFinite(val)) {
    if (UpdateConfig.setWordCount(val)) {
      ManualRestart.set();
      TestLogic.restart();
      if (val > 2000) {
        Notifications.add("Stay safe and take breaks!", 0);
      } else if (val === 0) {
        Notifications.add(
          "Infinite words! Make sure to use Bail Out from the command line to save your result.",
          0,
          {
            duration: 7,
          }
        );
      }
    }
  } else {
    Notifications.add("Custom word amount must be at least 1", 0);
  }

  hide(true);
}

const modal = new AnimatedModal({
  dialogId: "customWordAmountModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.addEventListener("submit", (e) => {
      e.preventDefault();
      apply();
    });
  },
});
