import AnimatedModal from "../utils/animated-modal";

export let minFilterLength: number = 0;
export let maxFilterLength: number = 0;

function handleFilterLength(
  modalEl: HTMLElement,
  minEl: HTMLInputElement,
  maxEl: HTMLInputElement
): void {
  minFilterLength = +minEl?.value;
  maxFilterLength = +maxEl?.value;
  let refreshButton = document.querySelector(
    ".refreshQuotes"
  ) as HTMLButtonElement;
  refreshButton.click();
}

export function show(): void {
  void modal.show();
}

function hide(): void {
  void modal.hide();
}

async function setup(modalEl: HTMLElement): Promise<void> {
  let submitButton = modalEl.querySelector("button");
  let minEl = modalEl.querySelector(".minFilterLength") as HTMLInputElement;
  let maxEl = modalEl.querySelector(".maxFilterLength") as HTMLInputElement;
  submitButton?.addEventListener("click", () => {
    handleFilterLength(modalEl, minEl, maxEl);
    hide();
  });

  minEl?.addEventListener("input", function () {
    handleFilterLength(modalEl, minEl, maxEl);
  });

  maxEl?.addEventListener("input", () => {
    handleFilterLength(modalEl, minEl, maxEl);
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteFilterModal",
  setup,
});
