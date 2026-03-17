import Ape from "../ape";
// import * as DB from "../db";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";

import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
// import * as Settings from "../pages/settings";
import { getSnapshot, setSnapshot } from "../db";
import AnimatedModal from "../utils/animated-modal";
import { Snapshot } from "../constants/default-snapshot";

let state = {
  offset: 0,
};

export function show(): void {
  void modal.show({
    focusFirstInput: "focusAndSelect",
    beforeAnimation: async (modalEl) => {
      if (getSnapshot()?.streakHourOffset !== undefined) {
        modalEl.qs("input")?.remove();
        modalEl.qs(".preview")?.remove();
        modalEl.qsa("button")?.remove();
        modalEl
          .qs(".text")
          ?.setText(
            `You have already set your streak hour offset to ${
              getSnapshot()?.streakHourOffset ?? "?"
            }. You can only set your streak hour offset once.`,
          );
      } else {
        state.offset = 0;
        updateDisplay();
        updatePreview();
      }
    },
  });
}

function updatePreview(): void {
  const inputValue = state.offset;
  const preview = modal.getModal().qs(".preview");

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const newDate = new Date();
  newDate.setUTCHours(0);
  newDate.setUTCMinutes(0);
  newDate.setUTCSeconds(0);
  newDate.setUTCMilliseconds(0);

  newDate.setHours(newDate.getHours() - -1 * Math.floor(inputValue)); //idk why, but it only works when i subtract (so i have to negate inputValue)
  newDate.setMinutes(
    newDate.getMinutes() - -1 * ((((inputValue % 1) + 1) % 1) * 60),
  );

  preview?.setHtml(`
    <div class="row"><div>Current local reset time:</div><div>${date.toLocaleTimeString()}</div></div>
    <div class="row"><div>New local reset time:</div><div>${newDate.toLocaleTimeString()}</div></div>
  `);
}

function updateDisplay(): void {
  modal
    .getModal()
    .qs<HTMLInputElement>("input")
    ?.setValue(state.offset.toFixed(1));
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const value = state.offset;

  if (isNaN(value)) {
    showNoticeNotification("Streak hour offset must be a number");
    return;
  }

  // Check if value is whole number or ends in .5 (multiply by 2 to check if result is integer)
  if (value < -11 || value > 12 || (value * 2) % 1 !== 0) {
    showNoticeNotification(
      "Streak offset must be between -11 and 12. Times ending in .5 can be used for 30-minute increments.",
    );
    return;
  }

  showLoaderBar();

  const response = await Ape.users.setStreakHourOffset({
    body: { hourOffset: value },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    showErrorNotification("Failed to set streak hour offset", { response });
  } else {
    showSuccessNotification("Streak hour offset set");
    const snap = getSnapshot() as Snapshot;

    snap.streakHourOffset = value;
    setSnapshot(snap);
    hide();
  }
}

function setStateToInput(): void {
  const inputValue = parseFloat(
    modal.getModal().qs<HTMLInputElement>("input")?.getValue() ?? "0",
  );
  if (!isNaN(inputValue)) {
    state.offset = inputValue;
    if (state.offset < -11) state.offset = -11;
    if (state.offset > 12) state.offset = 12;
  } else {
    state.offset = 0;
  }
}

const modal = new AnimatedModal({
  dialogId: "streakHourOffsetModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.qs("input")?.on("focusout", () => {
      setStateToInput();
      updateDisplay();
      updatePreview();
    });
    modalEl.qs("input")?.on("keyup", (e) => {
      if (e.key === "Enter") {
        setStateToInput();
        updateDisplay();
        updatePreview();
      }
    });
    modalEl.qs(".submit")?.on("click", () => {
      void apply();
    });
    modalEl.qs(".decreaseOffset")?.on("click", () => {
      state.offset -= 0.5;
      if (state.offset < -11) state.offset = -11;
      updateDisplay();
      updatePreview();
    });
    modalEl.qs(".increaseOffset")?.on("click", () => {
      state.offset += 0.5;
      if (state.offset > 12) state.offset = 12;
      updateDisplay();
      updatePreview();
    });
  },
});
