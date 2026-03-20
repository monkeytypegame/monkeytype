import {
  createHotkey,
  CreateHotkeyOptions,
  createHotkeySequence,
} from "@tanstack/solid-hotkeys";

import * as CommandlinePopup from "../../commandline/commandline";

import { isAnyPopupVisible } from "../../utils/misc";

import { QuickRestart } from "@monkeytype/schemas/configs";
import { getConfig } from "../../config/store";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";

function ifQuickRestart(key: QuickRestart): () => CreateHotkeyOptions {
  return () => ({
    enabled: getConfig.quickRestart === key,
    ignoreInputs: false,
    requireReset: true,
  });
}

function ifNotQuickRestart(key: QuickRestart): () => CreateHotkeyOptions {
  return () => ({
    enabled: getConfig.quickRestart !== key,
    ignoreInputs: false,
    requireReset: true,
  });
}

function openCommandline(e: KeyboardEvent): void {
  const popupVisible = isAnyPopupVisible();
  if (!popupVisible) {
    CommandlinePopup.show();
  }
}

function handleEnter(e: KeyboardEvent): void {
  if ((TestWords.hasNewline && e.shiftKey) || !TestWords.hasNewline) {
    TestLogic.restart({ isQuickRestart: !e.shiftKey });
    return;
  }
}

async function handleTab(e: KeyboardEvent): Promise<void> {
  if ((TestWords.hasTab && e.shiftKey) || !TestWords.hasTab) {
    TestLogic.restart({ isQuickRestart: !e.shiftKey });
    return;
  }
}

function handleEscape(e: KeyboardEvent): void {
  TestLogic.restart({ isQuickRestart: !e.shiftKey });
}

createHotkey("Escape", openCommandline, ifNotQuickRestart("esc"));
createHotkey("Tab", openCommandline, ifQuickRestart("esc"));
createHotkey("Mod+Shift+P", openCommandline, {
  ignoreInputs: false,
  requireReset: true,
});

createHotkey("Enter", handleEnter, ifQuickRestart("enter"));
createHotkey("Shift+Enter", handleEnter, ifQuickRestart("enter"));
createHotkey("Tab", handleTab, ifQuickRestart("tab"));
createHotkey("Shift+Tab", handleTab, ifQuickRestart("tab"));
createHotkey("Escape", handleEscape, ifQuickRestart("esc"));
createHotkey("Shift+Escape", handleEscape, ifQuickRestart("esc"));

createHotkeySequence(
  [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "B",
    "A",
  ],
  () => {
    window.open("https://keymash.io/", "_blank");
  },
);
