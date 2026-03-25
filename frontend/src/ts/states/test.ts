import { Challenge } from "@monkeytype/schemas/challenges";
import { createSignal } from "solid-js";

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);
export const [getResultVisible, setResultVisible] =
  createSignal<boolean>(false);
export const [getFocus, setFocus] = createSignal(false);
