import * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import { AnimatedModal } from "./animated-modal";

const wrapperId = "settingsImportPopup";

type State = {
  mode: "import" | "export";
  value: string;
};

const state: State = {
  mode: "import",
  value: "",
};

export function show(mode: "import" | "export", config?: string): void {
  state.mode = mode;
  state.value = config ?? "";

  void modal.show({
    callbacks: {
      beforeAnimation: async () => {
        $("#settingsImportPopup input").val(state.value);
        if (state.mode === "export") {
          $("#settingsImportPopup button").addClass("hidden");
          $("#settingsImportPopup input").prop("readonly", true);
        } else if (state.mode === "import") {
          $("#settingsImportPopup button").removeClass("hidden");
          $("#settingsImportPopup input").prop("readonly", false);
        }
      },
      afterAnimation: async () => {
        const inputEl = document.querySelector<HTMLInputElement>(
          "#settingsImportPopup input"
        );
        if (state.mode === "import") {
          inputEl?.focus();
        } else if (state.mode === "export") {
          inputEl?.select();
        }
      },
    },
  });
}

$("#settingsImportPopup input").on("input", (e) => {
  state.value = (e.target as HTMLInputElement).value;
});

$("#settingsImportPopup form").on("submit", async (e) => {
  e.preventDefault();
  if (state.mode !== "import") return;
  if (state.value === "") {
    void modal.hide();
    return;
  }
  try {
    await UpdateConfig.apply(JSON.parse(state.value));
  } catch (e) {
    Notifications.add("Failed to import settings: " + e, -1);
  }
  UpdateConfig.saveFullConfigToLocalStorage();
  void modal.hide();
});

const modal = new AnimatedModal(wrapperId);
