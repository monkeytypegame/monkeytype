import { envConfig } from "../constants/env-config";
import AnimatedModal from "../utils/animated-modal";
import { showPopup } from "./simple-modals";

export function show(): void {
  void modal.show();
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector(".generateData")?.addEventListener("click", () => {
    showPopup("devGenerateData");
  });
}

const modal = new AnimatedModal({
  dialogId: "devOptionsModal",
  setup,
});

export function appendButton(): void {
  $("body").prepend(
    `
      <div id="devButtons">
        <a class='button configureAPI' href='${envConfig.backendUrl}/configure/' target='_blank' aria-label="Configure API" data-balloon-pos="right"><i class="fas fa-fw fa-server"></i></a>
        <button class='button showDevOptionsModal' aria-label="Dev options" data-balloon-pos="right"><i class="fas fa-fw fa-flask"></i></button>
      <div>
      `
  );
  document
    .querySelector("#devButtons .button.showDevOptionsModal")
    ?.addEventListener("click", () => {
      show();
    });
}
