import AnimatedModal from "../utils/animated-modal";

export let filterLength = 0;

function handleLengthFilter(customFilterLength: number): void {
  filterLength = customFilterLength;
}

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
    let inputEl = modalEl.querySelector(".filterLength") as HTMLInputElement;
    let customFilterLength = +inputEl.value;
    handleLengthFilter(customFilterLength);
    hide(true);
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteFilterModal",
  setup,
});
