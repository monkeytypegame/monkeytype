import { Mode } from "@monkeytype/schemas/shared";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { configEvent } from "../events/config";
import { setCustomTextIndicator } from "../states/core";
import {
  consumeTrainingSession,
  getTrainingSavedSettings,
  startTrainingSession,
} from "../states/finger-training";
import { showNoticeNotification } from "../states/notifications";
import {
  buildTrainingPool,
  FingerName,
  getFingerLetters,
  mixWithNormalWords,
  resolveLayoutName,
} from "../utils/fingers";
import { getCurrentLanguage, getLayout } from "../utils/json-data";
import * as CustomText from "./custom-text";
import { before, resetBefore } from "./practise-words";

// distinguishes our own mode changes from the user's in the configEvent
// subscription below
let changingModeInternally = false;

function setModeInternally(mode: Mode, nosave: boolean): boolean {
  changingModeInternally = true;
  const success = setConfig("mode", mode, nosave ? { nosave: true } : {});
  changingModeInternally = false;
  return success;
}

export async function init(
  fingers: FingerName[],
  // 1 = every word trains the fingers, 2 = every other word, 3 = every third
  frequency = 1,
): Promise<boolean> {
  if (fingers.length === 0) return false;

  let targetLetters: Set<string>;
  let languageWords: string[];
  try {
    const [layout, language] = await Promise.all([
      getLayout(resolveLayoutName(Config.layout)),
      getCurrentLanguage(Config.language),
    ]);
    const fingerLetters = getFingerLetters(layout);
    targetLetters = new Set(fingers.flatMap((finger) => fingerLetters[finger]));
    languageWords = language.words;
  } catch (error) {
    console.error("Failed to start finger training", error);
    showNoticeNotification("Could not load layout or language data");
    return false;
  }

  if (targetLetters.size === 0) {
    showNoticeNotification(
      "The selected fingers have no letters on the current layout",
    );
    return false;
  }

  const { pool, drilledLetters } = buildTrainingPool(
    languageWords,
    targetLetters,
  );

  // when a practise words session is pending revert, absorb its original
  // settings so stopping the training restores the real ones
  const saved = getTrainingSavedSettings() ?? {
    mode: before.mode ?? Config.mode,
    customText: before.mode !== null ? before.customText : CustomText.getData(),
  };
  const limitValue =
    saved.mode === "words" && Config.words > 0 && Config.words <= 200
      ? Config.words
      : 50;

  // nothing may be persisted before the mode switch is known to be allowed
  // (it can be refused, e.g. mid-test with the no_quit funbox)
  if (!setModeInternally("custom", true)) {
    showNoticeNotification(
      "Could not start finger training - unable to switch to custom mode right now",
    );
    return false;
  }
  resetBefore();

  CustomText.setData({
    text: mixWithNormalWords(pool, languageWords, frequency),
    mode: "random",
    limit: { value: limitValue, mode: "word" },
    pipeDelimiter: false,
  });
  setCustomTextIndicator({ name: "finger training", isLong: false });
  startTrainingSession(saved, fingers);

  if (drilledLetters.length > 0) {
    showNoticeNotification(
      `Few or no words use ${drilledLetters.join(", ")} in the current language - added short letter drills. A larger word list (e.g. english 1k) gives more real words.`,
    );
  }

  return true;
}

export function stop(): boolean {
  const saved = getTrainingSavedSettings();
  if (saved === null) return false;

  // restore the mode first - if it is refused (e.g. no_quit funbox mid-test)
  // the session stays intact so stopping can be retried
  if (!setModeInternally(saved.mode, false)) {
    showNoticeNotification(
      "Could not stop finger training - finish or restart the current test first",
    );
    return false;
  }

  consumeTrainingSession();
  if (saved.customText !== null) {
    CustomText.setData(saved.customText);
  }
  setCustomTextIndicator(undefined);
  showNoticeNotification("Reverting to previous settings.");
  return true;
}

// the user changing the mode themselves also ends the session: keep the mode
// they picked, but put the overwritten custom text and indicator back
configEvent.subscribe(({ key }) => {
  if (key !== "mode" || changingModeInternally) return;
  const saved = consumeTrainingSession();
  if (saved === null) return;
  if (saved.customText !== null) {
    CustomText.setData(saved.customText);
  }
  setCustomTextIndicator(undefined);
});
