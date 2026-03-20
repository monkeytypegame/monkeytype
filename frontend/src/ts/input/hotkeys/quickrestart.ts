import { createHotkey, CreateHotkeyOptions } from "@tanstack/solid-hotkeys";

import { isAnyPopupVisible } from "../../utils/misc";

import { QuickRestart } from "@monkeytype/schemas/configs";
import { getConfig } from "../../config/store";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";
import { getActivePage } from "../../states/core";
import { navigate } from "../../controllers/route-controller";
import { isInputElementFocused } from "../../input/input-element";

function quickRestart(e: KeyboardEvent): void {
  if (!isInputElementFocused()) {
    const isInteractiveElement =
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA" ||
      document.activeElement?.tagName === "SELECT" ||
      document.activeElement?.tagName === "BUTTON" ||
      document.activeElement?.classList.contains("button") === true ||
      document.activeElement?.classList.contains("textButton") === true;

    if (isInteractiveElement) return;
  }

  if (isAnyPopupVisible()) {
    return;
  }

  if (getActivePage() === "test") {
    TestLogic.restart({ isQuickRestart: !e.shiftKey });
  } else {
    void navigate("");
  }
}

function ifQuickRestart(key: QuickRestart): () => CreateHotkeyOptions {
  return () => ({
    enabled: getConfig.quickRestart === key,
    ignoreInputs: false,
    requireReset: true,
  });
}

function handleEnter(e: KeyboardEvent): void {
  if ((TestWords.hasNewline && e.shiftKey) || !TestWords.hasNewline) {
    quickRestart(e);
  }
}

async function handleTab(e: KeyboardEvent): Promise<void> {
  if ((TestWords.hasTab && e.shiftKey) || !TestWords.hasTab) {
    quickRestart(e);
  }
}

function handleEscape(e: KeyboardEvent): void {
  quickRestart(e);
}

createHotkey("Enter", handleEnter, ifQuickRestart("enter"));
createHotkey("Shift+Enter", handleEnter, ifQuickRestart("enter"));
createHotkey("Tab", handleTab, ifQuickRestart("tab"));
createHotkey("Shift+Tab", handleTab, ifQuickRestart("tab"));
createHotkey("Escape", handleEscape, ifQuickRestart("esc"));
createHotkey("Shift+Escape", handleEscape, ifQuickRestart("esc"));
