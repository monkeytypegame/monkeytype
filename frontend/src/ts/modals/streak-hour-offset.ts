import Ape from "../ape";
// import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
// import * as Settings from "../pages/settings";
import * as ConnectionState from "../states/connection";
import { getSnapshot, setSnapshot } from "../db";
import AnimatedModal from "../utils/animated-modal";
import { Snapshot } from "../constants/default-snapshot";

let state = {
  offset: 0,
};

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  void modal.show({
    focusFirstInput: "focusAndSelect",
    beforeAnimation: async (modalEl) => {
      if (getSnapshot()?.streakHourOffset !== undefined) {
        modalEl.querySelector("input")?.remove();
        modalEl.querySelector(".preview")?.remove();
        for (const el of modalEl.querySelectorAll("button")) {
          el.remove();
        }
        (modalEl.querySelector(".text") as HTMLElement).textContent =
          `You have already set your streak hour offset to ${
            getSnapshot()?.streakHourOffset ?? "?"
          }. You can only set your streak hour offset once.`;
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

  const preview = modal.getModal().querySelector(".preview") as HTMLElement;

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const newDate = new Date();
  newDate.setUTCHours(0, 0, 0, 0);

  const hours = Math.floor(inputValue);
  const minutes = (inputValue % 1) * 60;

  newDate.setUTCHours(newDate.getUTCHours() + hours);
  newDate.setUTCMinutes(newDate.getUTCMinutes() + minutes);

  preview.innerHTML = `
    <div class="row"><div>Current local reset time:</div><div>${date.toLocaleTimeString()}</div></div>
    <div class="row"><div>New local reset time:</div><div>${newDate.toLocaleTimeString()}</div></div>
  `;
}

function updateDisplay(): void {
  const input = modal.getModal().querySelector("input");
  if (input) {
    input.value = state.offset.toFixed(1);
  }
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const value = state.offset;

  if (isNaN(value)) {
    Notifications.add("Streak hour offset must be a number", 0);
    return;
  }

  if (value < -11 || value > 12 || (value % 1 !== 0 && value % 1 !== 0.5)) {
    Notifications.add(
      "Streak offset must be between -11 and 12. Times ending in .5 can be used for 30-minute increments.",
      0,
    );
    return;
  }

  Loader.show();

  const response = await Ape.users.setStreakHourOffset({
    body: { hourOffset: value },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to set streak hour offset", -1, { response });
  } else {
    Notifications.add("Streak hour offset set", 1);
    const snap = getSnapshot() as Snapshot;

    snap.streakHourOffset = value;
    setSnapshot(snap);
    hide();
  }
}

function setStateToInput(): void {
  const inputValue = parseFloat(
    modal.getModal().querySelector("input")?.value as string,
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
    modalEl.querySelector("input")?.addEventListener("focusout", () => {
      setStateToInput();
      updateDisplay();
      updatePreview();
    });
    modalEl.querySelector("input")?.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        setStateToInput();
        updateDisplay();
        updatePreview();
      }
    });
    modalEl.querySelector(".submit")?.addEventListener("click", () => {
      void apply();
    });
    modalEl.querySelector(".decreaseOffset")?.addEventListener("click", () => {
      state.offset -= 0.5;
      if (state.offset < -11) state.offset = -11;
      updateDisplay();
      updatePreview();
    });
    modalEl.querySelector(".increaseOffset")?.addEventListener("click", () => {
      state.offset += 0.5;
      if (state.offset > 12) state.offset = 12;
      updateDisplay();
      updatePreview();
    });
  },
});
