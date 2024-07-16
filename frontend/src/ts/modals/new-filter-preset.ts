import { createFilterPreset } from "../elements/account/result-filters";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as Notifications from "../elements/notifications";

export function show(showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      (modalEl.querySelector("input") as HTMLInputElement).value = "";
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function apply(): void {
  const name = $("#newFilterPresetModal input").val() as string;
  if (name === "") {
    Notifications.add("Name cannot be empty", 0);
    return;
  }
  void createFilterPreset(name);
  hide(true);
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    apply();
  });
}

const modal = new AnimatedModal({
  dialogId: "newFilterPresetModal",
  setup,
});
