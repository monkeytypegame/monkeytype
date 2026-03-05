import { SimpleModal } from "../utils/simple-modal";

export let minFilterLength: number = 0;
export let maxFilterLength: number = 0;
export let removeCustom: boolean = false;

export function setRemoveCustom(value: boolean): void {
  removeCustom = value;
}

function refresh(): void {
  const refreshEvent = new CustomEvent("refresh");
  document.dispatchEvent(refreshEvent);
}

export const quoteFilterModal = new SimpleModal({
  id: "quoteFilter",
  title: "Enter minimum and maximum number of words",
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

    let message: string = "Saved custom filter";
    return { status: 1, message };
  },
  afterClickAway: () => {
    setRemoveCustom(true);
    refresh();
  },
});
