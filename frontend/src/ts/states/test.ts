import { createSignal } from "solid-js";
import { Challenge } from "@monkeytype/schemas/challenges";

export const [wordsHasNewline, setWordsHasNewline] = createSignal(false);
export const [wordsHasTab, setWordsHasTab] = createSignal(false);

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);
export const [getResultVisible, setResultVisible] =
  createSignal<boolean>(false);
export const [getFocus, setFocus] = createSignal(false);
