import {
  CustomTextSettings,
  CustomTextSettingsSchema,
} from "@monkeytype/schemas/results";
import { Mode } from "@monkeytype/schemas/shared";
import { createSignal } from "solid-js";

import * as CustomText from "../test/custom-text";
import { FingerName } from "../utils/fingers";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

export type TrainingSavedSettings = {
  mode: Mode;
  // the persisted custom text the session overwrote; null only when the
  // session absorbed a practise words session that had nothing saved
  customText: CustomTextSettings | null;
};

// fingers being trained by the currently active finger training session,
// empty when no session is active
const [getTrainingFingers, setTrainingFingers] = createSignal<FingerName[]>([]);
export { getTrainingFingers };

// settings to restore when the session ends. the custom text part is also
// mirrored to localStorage because starting a session overwrites the
// persisted custom text - without the mirror, a page reload mid-session
// would lose the user's custom text forever.
let savedSettings: TrainingSavedSettings | null = null;

const customTextBackupLS = new LocalStorageWithSchema({
  key: "fingerTrainingCustomTextBackup",
  schema: CustomTextSettingsSchema.nullable(),
  fallback: null,
});

export function isTrainingSessionActive(): boolean {
  return savedSettings !== null;
}

export function getTrainingSavedSettings(): TrainingSavedSettings | null {
  return savedSettings;
}

/** activates (or re-configures) the session; backs up the custom text once */
export function startTrainingSession(
  saved: TrainingSavedSettings,
  fingers: FingerName[],
): void {
  if (savedSettings === null && saved.customText !== null) {
    customTextBackupLS.set(saved.customText);
  }
  savedSettings = saved;
  setTrainingFingers(fingers);
}

/**
 * Ends the session and returns the settings to restore (null when no session
 * was active). The caller decides how much of them to put back.
 */
export function consumeTrainingSession(): TrainingSavedSettings | null {
  const saved = savedSettings;
  if (saved === null) return null;
  savedSettings = null;
  setTrainingFingers([]);
  customTextBackupLS.set(null);
  return saved;
}

// heal a session lost to a page reload: the mode change was nosave so the
// config came back on its own, but the persisted custom text still holds
// the training pool - put the user's real custom text back
const leftoverBackup = customTextBackupLS.get();
if (leftoverBackup !== null) {
  CustomText.setData(leftoverBackup);
  customTextBackupLS.set(null);
}
