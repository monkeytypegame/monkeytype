import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestLogic from "../../test/test-logic";
import { getCharFromEvent } from "../../test/layout-emulator";
import * as Monkey from "../../test/monkey";
import { emulateInsertText } from "./insert-text";
import * as TestState from "../../test/test-state";
import * as TestWords from "../../test/test-words";
import * as JSONData from "../../utils/json-data";
import * as Notifications from "../../elements/notifications";
import * as KeyConverter from "../../utils/key-converter";
import * as ShiftTracker from "../../test/shift-tracker";
import * as CompositionState from "../../states/composition";
import { canQuickRestart } from "../../utils/quick-restart";
import * as CustomText from "../../test/custom-text";
import * as CustomTextState from "../../states/custom-text-name";
import {
  getLastBailoutAttempt,
  setCorrectShiftUsed,
  setLastBailoutAttempt,
} from "../core/state";
import {
  getActiveFunboxesWithFunction,
  getActiveFunboxNames,
} from "../../test/funbox/list";

export async function handleTab(e: KeyboardEvent, now: number): Promise<void> {
  if (Config.quickRestart === "tab") {
    e.preventDefault();
    if ((TestWords.hasTab && e.shiftKey) || !TestWords.hasTab) {
      TestLogic.restart();
      return;
    }
  }
  if (TestWords.hasTab) {
    await emulateInsertText({ data: "\t", now });
    e.preventDefault();
    return;
  }
}

export async function handleEnter(
  e: KeyboardEvent,
  now: number
): Promise<void> {
  if (e.shiftKey) {
    if (Config.mode === "zen") {
      void TestLogic.finish();
      return;
    } else if (
      !canQuickRestart(
        Config.mode,
        Config.words,
        Config.time,
        CustomText.getData(),
        CustomTextState.isCustomTextLong() ?? false
      )
    ) {
      const delay = Date.now() - getLastBailoutAttempt();
      if (getLastBailoutAttempt() === -1 || delay > 200) {
        setLastBailoutAttempt(Date.now());
        if (delay >= 5000) {
          Notifications.add(
            "Please double tap shift+enter to confirm bail out",
            0,
            {
              important: true,
              duration: 5,
            }
          );
        }
        return;
      } else {
        TestState.setBailedOut(true);
        void TestLogic.finish();
        return;
      }
    }
  }

  if (Config.quickRestart === "enter") {
    e.preventDefault();
    if ((TestWords.hasNewline && e.shiftKey) || !TestWords.hasNewline) {
      TestLogic.restart();
      return;
    }
  }
  if (
    TestWords.hasNewline ||
    (Config.mode === "zen" && !CompositionState.getComposing())
  ) {
    await emulateInsertText({ data: "\n", now });
    e.preventDefault();
    return;
  }
}

export async function handleOppositeShift(event: KeyboardEvent): Promise<void> {
  if (
    Config.oppositeShiftMode === "keymap" &&
    Config.keymapLayout !== "overrideSync"
  ) {
    let keymapLayout = await JSONData.getLayout(Config.keymapLayout).catch(
      () => undefined
    );
    if (keymapLayout === undefined) {
      Notifications.add("Failed to load keymap layout", -1);

      return;
    }

    const funbox = getActiveFunboxNames().includes("layout_mirror");
    if (funbox) {
      keymapLayout = KeyConverter.mirrorLayoutKeys(keymapLayout);
    }

    const keycode = KeyConverter.layoutKeyToKeycode(event.key, keymapLayout);

    setCorrectShiftUsed(
      keycode === undefined ? true : ShiftTracker.isUsingOppositeShift(keycode)
    );
  } else {
    setCorrectShiftUsed(
      ShiftTracker.isUsingOppositeShift(event.code as KeyConverter.Keycode)
    );
  }
}

export async function onKeydown(event: KeyboardEvent): Promise<void> {
  console.debug("wordsInput event keydown", {
    event,
    key: event.key,
    code: event.code,
  });

  const now = performance.now();
  TestInput.recordKeydownTime(now, event);

  // allow arrows in arrows funbox
  const arrowsActive = Config.funbox.includes("arrows");
  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown" ||
    (event.key.startsWith("Arrow") && !arrowsActive)
  ) {
    event.preventDefault();
    return;
  }

  for (const fb of getActiveFunboxesWithFunction("handleKeydown")) {
    void fb.functions.handleKeydown(event);
  }

  if (Config.oppositeShiftMode !== "off") {
    await handleOppositeShift(event);
  }

  for (const fb of getActiveFunboxesWithFunction("getEmulatedChar")) {
    const emulatedChar = fb.functions.getEmulatedChar(event);
    if (emulatedChar !== null) {
      await emulateInsertText({ data: emulatedChar, now });
      event.preventDefault();
      return;
    }
  }

  if (Config.layout !== "default") {
    const emulatedChar = await getCharFromEvent(event);
    if (emulatedChar !== null) {
      await emulateInsertText({ data: emulatedChar, now });
      event.preventDefault();
      return;
    }
  }

  if (!event.repeat) {
    //delaying because type() is called before show()
    // meaning the first keypress of the test is not animated
    setTimeout(() => {
      Monkey.type(event);
    }, 0);
  }

  if (event.key === "Tab") {
    await handleTab(event, now);
    return;
  }

  if (event.key === "Enter") {
    await handleEnter(event, now);
    return;
  }

  if (event.key === "Escape" && Config.quickRestart === "esc") {
    event.preventDefault();
    TestLogic.restart();
    return;
  }
}
