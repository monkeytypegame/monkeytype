import { createSignal } from "solid-js";

export const [wordsHasNewline, setWordsHasNewline] = createSignal(false);
export const [wordsHasTab, setWordsHasTab] = createSignal(false);
