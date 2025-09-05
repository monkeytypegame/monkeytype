import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";
import * as JSONData from "../../utils/json-data";
import * as Notifications from "../../elements/notifications";
import * as KeyConverter from "../../utils/key-converter";
import * as ShiftTracker from "../../test/shift-tracker";
import * as CompositionState from "../../states/composition";
import { getCharFromEvent } from "../../test/layout-emulator";
import * as Monkey from "../../test/monkey";
import { canQuickRestart } from "../../utils/quick-restart";
import * as CustomText from "../../test/custom-text";
import * as CustomTextState from "../../states/custom-text-name";
import {
  getLastBailoutAttempt,
  setCorrectShiftUsed,
  setLastBailoutAttempt,
} from "../state";
import { emulateInsertText } from "../emulation";

function handleKeydownTiming(event: KeyboardEvent, now: number): void {
  if (event.repeat) {
    console.log(
      "spacing debug keydown STOPPED - repeat",
      event.key,
      event.code,
      //ignore for logging
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.which
    );
    return;
  }

  let eventCode = event.code;

  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    eventCode = "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    eventCode = "NoCode";
  }

  setTimeout(() => {
    if (eventCode === "" || event.key === "Unidentified") {
      eventCode = "NoCode";
    }
    TestInput.recordKeydownTime(now, eventCode);
  }, 0);
}

async function handleTab(e: KeyboardEvent, now: number): Promise<void> {
  if (Config.quickRestart === "tab") {
    e.preventDefault();
    if ((TestWords.hasTab && e.shiftKey) || !TestWords.hasTab) {
      TestLogic.restart();
      return;
    }
  }
  if (TestWords.hasTab) {
    await emulateInsertText("\t", e, now);
    e.preventDefault();
    return;
  }
}

async function handleEnter(e: KeyboardEvent, now: number): Promise<void> {
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
      } else {
        TestState.setBailedOut(true);
        void TestLogic.finish();
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
    await emulateInsertText("\n", e, now);
    e.preventDefault();
    return;
  }
}

async function handleArrows(event: KeyboardEvent, now: number): Promise<void> {
  const map: Record<string, string> = {
    ArrowUp: "w",
    ArrowDown: "s",
    ArrowLeft: "a",
    ArrowRight: "d",
  };

  const char = map[event.key];

  if (char !== undefined) {
    await emulateInsertText(char, event, now);
  }
  event.preventDefault();
}

async function handleOppositeShift(event: KeyboardEvent): Promise<void> {
  if (
    Config.oppositeShiftMode === "keymap" &&
    Config.keymapLayout !== "overrideSync"
  ) {
    const keymapLayout = await JSONData.getLayout(Config.keymapLayout).catch(
      () => undefined
    );
    if (keymapLayout === undefined) {
      Notifications.add("Failed to load keymap layout", -1);

      return;
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

export async function handleKeydown(event: KeyboardEvent): Promise<void> {
  const now = performance.now();
  handleKeydownTiming(event, now);

  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown"
  ) {
    event.preventDefault();
    return;
  }

  if (Config.oppositeShiftMode !== "off") {
    await handleOppositeShift(event);
  }

  // there used to be an if check here with funbox preventDefaultEvent check
  // but its only used in arrows so im not sure if its needed
  // todo: decide what to do
  const arrowsActive = Config.funbox.includes("arrows");
  if (arrowsActive && event.key.startsWith("Arrow")) {
    await handleArrows(event, now);
    return;
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
  }

  if (event.key === "Enter") {
    await handleEnter(event, now);
  }

  if (event.key === "Escape" && Config.quickRestart === "esc") {
    event.preventDefault();
    TestLogic.restart();
    return;
  }

  if (Config.layout !== "default") {
    const emulatedChar = await getCharFromEvent(event);

    if (emulatedChar !== null) {
      await emulateInsertText(emulatedChar, event, now);
      event.preventDefault();
      return;
    }
  }
}
