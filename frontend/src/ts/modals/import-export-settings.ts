import * as UpdateConfig from "../config";
import AnimatedModal from "../utils/animated-modal";

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
    focusFirstInput: "focusAndSelect",
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
  });
}

const modal = new AnimatedModal({
  dialogId: "importExportSettingsModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.querySelector("input")?.addEventListener("input", (e) => {
      state.value = (e.target as HTMLInputElement).value;
    });
    modalEl?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state.mode !== "import") return;
      if (state.value === "") {
        void modal.hide();
        return;
      }
      await UpdateConfig.applyFromJson(state.value);
      void modal.hide();
    });
  },
});
