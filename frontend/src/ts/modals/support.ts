import AnimatedModal from "../utils/animated-modal";
import { getCommandline } from "../utils/async-modules";

export function show(): void {
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "supportModal",
  setup: (modalEl): void => {
    modalEl.querySelector("button.ads")?.addEventListener("click", async () => {
      const commandline = await getCommandline();
      commandline.show(
        { subgroupOverride: "enableAds" },
        {
          modalChain: modal,
        }
      );
    });
  },
});
