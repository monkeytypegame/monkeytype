import Ape from "../ape";
// import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
// import * as Settings from "../pages/settings";
import * as ConnectionState from "../states/connection";
import { getSnapshot, setSnapshot } from "../db";
import AnimatedModal from "../utils/animated-modal";
import { Snapshot } from "../constants/default-snapshot";

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline :(", 0, {
      duration: 2,
    });
    return;
  }

  void modal.show({
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      if (getSnapshot()?.streakHourOffset !== undefined) {
        modalEl.querySelector("input")?.remove();
        modalEl.querySelector(".preview")?.remove();
        modalEl.querySelector("button")?.remove();
        (modalEl.querySelector(".text") as HTMLElement).textContent =
          "You have already set your streak time offset.";
      } else {
        (modalEl.querySelector("input") as HTMLInputElement).value = "0";
        updatePreview();
      }
    },
  });
}

function updatePreview(): void {
  const inputValue = parseFloat( // parse float to support fractional stuff
    modal.getModal().querySelector("input")?.value as string,
  );

  const preview = modal.getModal().querySelector(".preview") as HTMLElement;

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const newDate = new Date();
  newDate.setUTCHours(0, 0, 0, 0);

  const hours = Math.floor(inputValue); // integer part is hour offset
  const minutes = (inputValue % 1) * 60; // fractional part is minutes

  // apply hr and min offsets
  newDate.setUTCHours(newDate.getUTCHours() + hours);
  newDate.setUTCMinutes(newDate.getUTCMinutes() + minutes);

  preview.innerHTML = `
    <div class="row"><div>Current local reset time:</div><div>${date.toLocaleTimeString()}</div></div>
    <div class="row"><div>New local reset time:</div><div>${newDate.toLocaleTimeString()}</div></div>
  `;
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const value = parseFloat( // parse float again
    modal.getModal().querySelector("input")?.value as string,
  );

  if (isNaN(value)) {
    Notifications.add("Streak hour offset must be a number", 0);
    return;
  }

  // 0.0 or 0.5 (assuming we only wanna allow 30 min offsets like in original issue)
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

    // Save the new streak hour offset
    snap.streakHourOffset = value;
    setSnapshot(snap);
    hide();
  }
}

const modal = new AnimatedModal({
  dialogId: "streakHourOffsetModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.querySelector("input")?.addEventListener("input", () => {
      updatePreview();
    });
    modalEl.querySelector("button")?.addEventListener("click", () => {
      void apply();
    });
  },
});
