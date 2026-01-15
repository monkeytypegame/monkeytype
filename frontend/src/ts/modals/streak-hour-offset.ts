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
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      if (getSnapshot()?.streakHourOffset !== undefined) {
        modalEl.qs("input")?.remove();
        modalEl.qs(".preview")?.remove();
        modalEl.qs("button")?.remove();
        modalEl
          .qs(".text")
          ?.setText("You have already set your streak hour offset.");
      } else {
        modalEl.qs<HTMLInputElement>("input")?.setValue("0");
        updatePreview();
      }
    },
  });
}

function updatePreview(): void {
  const inputValue = state.offset;
  const preview = modal.getModal().qs(".preview");

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
  newDate.setMinutes(newDate.getMinutes() - -1 * ((inputValue % 1) * 60));

  preview?.setHtml(`
    <div class="row"><div>Current local reset time:</div><div>${date.toLocaleTimeString()}</div></div>
    <div class="row"><div>New local reset time:</div><div>${newDate.toLocaleTimeString()}</div></div>
  `);
}

function hide(): void {
  void modal.hide();
}

async function apply(): Promise<void> {
  const value = parseInt(
    modal.getModal().qs<HTMLInputElement>("input")?.getValue() ?? "",
    10,
  );

  if (isNaN(value)) {
    Notifications.add("Streak hour offset must be a number", 0);
    return;
  }

  // Check if value is whole number or ends in .5 (multiply by 2 to check if result is integer)
  if (value < -11 || value > 12 || (value * 2) % 1 !== 0) {
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

const modal = new AnimatedModal({
  dialogId: "streakHourOffsetModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.qs("input")?.on("input", () => {
      updatePreview();
    });
    modalEl.qs("button")?.on("click", () => {
      void apply();
    });
  },
});
