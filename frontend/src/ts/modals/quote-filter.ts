import AnimatedModal from "../utils/animated-modal";

export let minFilterLength: number = 0;
export let maxFilterLength: number = 0;

export function show(): void {
  void modal.show();
}

function hide(clearModalChain: boolean): void {
  void modal.hide({
    clearModalChain,
  });
}

async function setup(modalEl: HTMLElement): Promise<void> {
  let submitButton = modalEl.querySelector("button");
  submitButton?.addEventListener("click", () => {
    let minEl = modalEl.querySelector(".minFilterLength") as HTMLInputElement;
    let maxEl = modalEl.querySelector(".maxFilterLength") as HTMLInputElement;
    minFilterLength = +minEl?.value;
    maxFilterLength = +maxEl?.value;
    hide(true);
    let refreshButton = document.querySelector(
      ".refreshQuotes"
    ) as HTMLButtonElement;
    refreshButton.click();
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteFilterModal",
  setup,
});
