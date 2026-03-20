import { QuickRestart as QuickRestartType } from "@monkeytype/schemas/configs";
import {
  createHotkey,
  CreateHotkeyOptions,
  Hotkey,
} from "@tanstack/solid-hotkeys";
import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";
import { Kbd } from "./Kbd";

const hotkeyMap: Record<QuickRestartType, Hotkey | undefined> = {
  off: undefined,
  enter: "Enter",
  esc: "Escape",
  tab: "Tab",
};

const handleEnter = (e: KeyboardEvent) => {
  if ((TestWords.hasNewline && e.shiftKey) || !TestWords.hasNewline) {
    TestLogic.restart({ isQuickRestart: !e.shiftKey });
    return;
  }
};

const handleTab = async (e: KeyboardEvent) => {
  if ((TestWords.hasTab && e.shiftKey) || !TestWords.hasTab) {
    TestLogic.restart({ isQuickRestart: !e.shiftKey });
    return;
  }
};

const handleEscape = (e: KeyboardEvent) => {
  TestLogic.restart({ isQuickRestart: !e.shiftKey });
};

const ifEnabled = (key: QuickRestartType) => (): CreateHotkeyOptions => ({
  enabled: getConfig.quickRestart === key,
  ignoreInputs: false,
  requireReset: true,
});

createHotkey("Enter", handleEnter, ifEnabled("enter"));
createHotkey("Shift+Enter", handleEnter, ifEnabled("enter"));
createHotkey("Tab", handleTab, ifEnabled("tab"));
createHotkey("Shift+Tab", handleTab, ifEnabled("tab"));
createHotkey("Escape", handleEscape, ifEnabled("esc"));
createHotkey("Shift+Escape", handleEscape, ifEnabled("esc"));

export function QuickRestart(): JSXElement {
  return (
    <Show
      when={hotkeyMap[getConfig.quickRestart] !== undefined}
      fallback=<>
        <kbd>tab</kbd> + <kbd>enter</kbd>
      </>
    >
      <Kbd hotkey={hotkeyMap[getConfig.quickRestart] as Hotkey} />
    </Show>
  );
}
