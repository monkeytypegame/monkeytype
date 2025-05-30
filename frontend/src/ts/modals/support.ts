import AnimatedModal from "../utils/animated-modal";
import * as Commandline from "../commandline/commandline";

export function show(): void {
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "supportModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.querySelector("button.ads")?.addEventListener("click", async () => {
      Commandline.show(
        { subgroupOverride: "enableAds" },
        {
          modalChain: modal,
        }
      );
    });
  },
});
