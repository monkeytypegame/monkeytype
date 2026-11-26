import { createMemo, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { showCommandline } from "../../../states/commandline";
import { getModifierState, isCapsLockOn } from "../../../states/modifiers";
import {
  getKeymapFlashState,
  getKeymapHighlightKey,
} from "../../../states/test";
import { wordsHaveNumbers } from "../../../test/engine/state";
import { type KeyFlash, Keymap } from "../../common/keymap/Keymap";
import { getKeymapLookFromConfig } from "./keymap-look";

/**
 * The test page's keymap: the config's look, and per keymap mode either the
 * next key ("next") or the typed keys' flashes ("react").
 */
export function TestKeymap() {
  const flashes = createMemo(
    (): Record<string, KeyFlash | undefined> | undefined => {
      if (getConfig.keymapMode !== "react") return undefined;
      if (!getConfig.blindMode) return getKeymapFlashState;
      // blind mode hides mistakes: every flash shows as correct
      const shown: Record<string, KeyFlash | undefined> = {};
      for (const [legend, flash] of Object.entries(getKeymapFlashState)) {
        shown[legend] = flash && { ...flash, correct: true };
      }
      return shown;
    },
  );

  // the key to press next ("next" mode)
  const nextKey = createMemo((): ReadonlySet<string> | undefined => {
    if (getConfig.keymapMode !== "next") return undefined;
    const key = getKeymapHighlightKey();
    return key === undefined ? undefined : new Set([key]);
  });

  return (
    <Show when={getConfig.keymapMode !== "off" && getKeymapLookFromConfig()}>
      {(look) => (
        <Keymap
          {...look()}
          // "next" highlights digits too, so words with numbers need the row
          shownKeys={
            look().shownKeys === "minimal" &&
            wordsHaveNumbers() &&
            getConfig.keymapMode === "next"
              ? "minimal_numrow"
              : look().shownKeys
          }
          modifiers={{ ...getModifierState(), capsLock: isCapsLockOn() }}
          legendHighlights={nextKey()}
          legendFlashes={flashes()}
          onLayoutIndicatorClick={() =>
            showCommandline({ subgroupOverride: "keymapLayout" })
          }
        />
      )}
    </Show>
  );
}
