import { SimpleModal } from "../utils/simple-modal";

export let minFilterLength: number = 0;
export let maxFilterLength: number = 0;
export let usingCustomLength = true;

function refresh(): void {
  let refreshButton = document.querySelector(
    ".refreshQuotes"
  ) as HTMLButtonElement;
  refreshButton.click();
}

export function setUsingCustomLength(value: boolean): void {
  usingCustomLength = value;
}

export const quoteFilterModal = new SimpleModal({
  id: "quoteFilter",
  title: "Enter minimum and maximum values",
  inputs: [
    {
      placeholder: "1",
      type: "number",
    },
    {
      placeholder: "100",
      type: "number",
    },
  ],
  buttonText: "save",
  onlineOnly: true,
  execFn: async (_thisPopup, min, max) => {
    const minNum = parseInt(min, 10);
    const maxNum = parseInt(max, 10);
    if (isNaN(minNum) || isNaN(maxNum)) {
      return {
        status: 0,
        message: "Invalid min/max values",
      };
    }

    minFilterLength = minNum;
    maxFilterLength = maxNum;
    refresh();

    let message: string = "saved custom filter";
    return { status: 1, message };
  },
});
