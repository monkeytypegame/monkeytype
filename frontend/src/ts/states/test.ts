import { createSignal, createEffect } from "solid-js";
import { Challenge } from "@monkeytype/schemas/challenges";
import { getConfig } from "../config/store";
import { getActivePage } from "./core";
import { canQuickRestart } from "../utils/quick-restart";
import { getData as getCustomTextData } from "../test/custom-text";
import { isCustomTextLong } from "../legacy-states/custom-text-name";

export const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
export const [wordsHaveTab, setWordsHaveTab] = createSignal(false);

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);
export const [getResultVisible, setResultVisible] = createSignal(false);
export const [getFocus, setFocus] = createSignal(false);

export const [isLongTest, setIsLongTest] = createSignal(false);

createEffect(() => {
  getActivePage(); // depend on active page
  setIsLongTest(
    !canQuickRestart(
      getConfig.mode,
      getConfig.words,
      getConfig.time,
      getCustomTextData(),
      isCustomTextLong() ?? false,
    ),
  );
});
