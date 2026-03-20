import { createSignal } from "solid-js";

export type CustomTextIncomingData = {
  text: string;
  set?: boolean;
  long?: boolean;
} | null;

const [customTextIncomingData, setCustomTextIncomingData] =
  createSignal<CustomTextIncomingData>(null);

const [textToSave, setTextToSave] = createSignal<string[]>([]);

export {
  customTextIncomingData,
  setCustomTextIncomingData,
  textToSave,
  setTextToSave,
};
