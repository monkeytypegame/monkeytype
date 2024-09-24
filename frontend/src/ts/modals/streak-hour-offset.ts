import Ape from "../ape";
// import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
// import * as Settings from "../pages/settings";
import * as ConnectionState from "../states/connection";
import { getSnapshot, setSnapshot, Snapshot } from "../db";
import AnimatedModal from "../utils/animated-modal";

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
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
          "You have already set your streak hour offset.";
      } else {
        (modalEl.querySelector("input") as HTMLInputElement).value = "0";
        updatePreview();
      }
    },
  });
}

function updatePreview(): void {
  const inputValue = parseInt(
    modal.getModal().querySelector("input")?.value as string,
    10
  );

  const preview = modal.getModal().querySelector(".preview") as HTMLElement;

  const date = new Date();
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  const newDate = new Date();
  newDate.setUTCHours(0);
  newDate.setUTCMinutes(0);
  newDate.setUTCSeconds(0);
  newDate.setUTCMilliseconds(0);

  newDate.setHours(newDate.getHours() - -1 * inputValue); //idk why, but it only works when i subtract (so i have to negate inputValue)

  preview.innerHTML = `
    <div class="row"><div>Current local reset time:</div><div>${date.toLocaleTimeString()}</div></div>
    <div class="row"><div>New local reset time:</div><div>${newDate.toLocaleTimeString()}</div></div>
  `;
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const value = parseInt(
    modal.getModal().querySelector("input")?.value as string,
    10
  );

  if (isNaN(value)) {
    Notifications.add("Streak hour offset must be a number", 0);
    return;
  }

  if (value < -11 || value > 12) {
    Notifications.add("Streak hour offset must be between -11 and 12", 0);
    return;
  }

  Loader.show();

  const response = await Ape.users.setStreakHourOffset({
    body: { hourOffset: value },
  });
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(
      "Failed to set streak hour offset: " + response.body.message,
      -1
    );
  } else {
    Notifications.add("Streak hour offset set", 1);
    const snap = getSnapshot() as Snapshot;
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
