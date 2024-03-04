import * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import AnimatedModal from "./animated-modal";

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
    beforeAnimation: async (modal) => {
      (modal.querySelector("input") as HTMLInputElement).value = state.value;
      if (state.mode === "export") {
        modal.querySelector("button")?.classList.add("hidden");
        modal.querySelector("input")?.setAttribute("readonly", "true");
      } else if (state.mode === "import") {
        modal.querySelector("button")?.classList.remove("hidden");
        modal.querySelector("input")?.removeAttribute("readonly");
      }
    },
    afterAnimation: async (modal) => {
      const inputEl = modal.querySelector("input");
      if (state.mode === "import") {
        inputEl?.focus();
      } else if (state.mode === "export") {
        inputEl?.select();
      }
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

const modal = new AnimatedModal("settingsImportPopup", "popups");
