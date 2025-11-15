import AnimatedModal from "../utils/animated-modal";

export let minFilterLength: number = 0;
export let maxFilterLength: number = 0;

function handleFilterLength(modalEl: HTMLElement): void {
  let minEl = modalEl.querySelector(".minFilterLength") as HTMLInputElement;
  let maxEl = modalEl.querySelector(".maxFilterLength") as HTMLInputElement;
  minFilterLength = +minEl?.value;
  maxFilterLength = +maxEl?.value;
}

export function show(): void {
  void modal.show();
}

function hide(): void {
  void modal.hide();
}

async function setup(modalEl: HTMLElement): Promise<void> {
  let submitButton = modalEl.querySelector("button");
  submitButton?.addEventListener("click", () => {
    handleFilterLength(modalEl);
    hide();
  });
}

async function cleanup(): Promise<void> {
  let refreshButton = document.querySelector(
    ".refreshQuotes"
  ) as HTMLButtonElement;
  refreshButton.click();
}

const modal = new AnimatedModal({
  dialogId: "quoteFilterModal",
  setup,
  cleanup,
});
