import AnimatedModal from "./animated-modal";
import { getCommandline } from "../utils/async-modules";

export function show(): void {
  void modal.show();
}

const modal = new AnimatedModal("supportMePopup", "popups", undefined, {
  setup: (modalEl): void => {
    modalEl.querySelector("button.ads")?.addEventListener("click", async () => {
      const commandline = await getCommandline();
      await modal.hide({ animationMode: "modalOnly" });
      commandline.show(
        { subgroupOverride: "enableAds" },
        { animationMode: "modalOnly" }
      );
    });
  },
});
