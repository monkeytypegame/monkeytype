import { applyConfigFromJson } from "../config";
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
      modal.qs<HTMLInputElement>("input")?.setValue(state.value);
      if (state.mode === "export") {
        modal.qs("button")?.hide();
        modal.qs("input")?.setAttribute("readonly", "true");
      } else if (state.mode === "import") {
        modal.qs("button")?.show();
        modal.qs("input")?.removeAttribute("readonly");
      }
    },
  });
}

const modal = new AnimatedModal({
  dialogId: "importExportSettingsModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.qs("input")?.on("input", (e) => {
      state.value = (e.target as HTMLInputElement).value;
    });
    modalEl?.on("submit", async (e) => {
      e.preventDefault();
      if (state.mode !== "import") return;
      if (state.value === "") {
        void modal.hide();
        return;
      }
      await applyConfigFromJson(state.value);
      void modal.hide();
    });
  },
});
