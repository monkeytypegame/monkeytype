import Config from "../config";
import { getRoom } from "./tribe-state";
import tribeSocket from "./tribe-socket";
import * as ConfigEvent from "../observables/config-event";
import * as TribeTypes from "./types";
import { Caret } from "../utils/caret";
import { createElementWithUtils, qsr } from "../utils/dom";
import * as TestState from "../test/test-state";
import { EasingParam } from "animejs";

const wordsWrapper = qsr(".pageTest #wordsWrapper");

const carets: Map<string, Caret> = new Map();

export function init(): void {
  if (Config.tribeCarets === "off") return;
  const room = getRoom();
  if (!room) return;
  for (const socketId of Object.keys(room.users)) {
    if (socketId === tribeSocket.getId()) continue;
    if (room.users[socketId]?.isTyping !== true) continue;

    const name = room.users[socketId].name;

    const caretEl = createElementWithUtils("div", {
      classList: ["tribeCaret", "full-width"],
      id: `tribeCaret-${socketId}`,
      dataset: { socketId: socketId },
    });

    caretEl.appendHtml(
      `<div class="caretName ${Config.tribeCarets === "noNames" ? "hidden" : ""}">${name}</div>`,
    );

    wordsWrapper.append(caretEl);

    carets.set(socketId, new Caret(caretEl, "default"));
  }
}

export function resetAllPositions(): void {
  for (const [socketId, caret] of carets.entries()) {
    caret.stopAllAnimations();
    caret.clearMargins();
    caret.goTo({
      wordIndex: 0,
      letterIndex: 0,
      isLanguageRightToLeft: TestState.isLanguageRightToLeft,
      isDirectionReversed: TestState.isDirectionReversed,
      animate: false,
    });
    setError(socketId, false);
  }
}

export function updateAndAnimate(
  data: Record<string, TribeTypes.UserProgress>,
): void {
  for (const socketId of Object.keys(data)) {
    const d = data[socketId] as TribeTypes.UserProgress;
    if (!carets.has(socketId)) continue;

    carets.get(socketId)?.goTo({
      wordIndex: d.wordIndex,
      letterIndex: d.letterIndex,
      isLanguageRightToLeft: TestState.isLanguageRightToLeft,
      isDirectionReversed: TestState.isDirectionReversed,
      animate: true,
      animationOptions: {
        duration: getRoom()?.updateRate ?? 500,
      },
    });
  }
}

export function destroy(socketId: string): void {
  if (carets.has(socketId)) {
    carets.get(socketId)?.getElement().remove();
    carets.delete(socketId);
  }
}

export function setError(socketId: string, isError: boolean): void {
  if (carets.has(socketId)) {
    if (isError) {
      carets.get(socketId)?.getElement().addClass("error");
    } else {
      carets.get(socketId)?.getElement().removeClass("error");
    }
  }
}

export function destroyAll(): void {
  for (const socketId of carets.keys()) {
    destroy(socketId);
  }
}

export function handleTapeWordsRemoved(widthRemoved: number): void {
  for (const caret of carets.values()) {
    caret.handleTapeWordsRemoved(widthRemoved);
  }
}

export function handleTapeScroll(options: {
  newValue: number;
  duration: number;
  ease: EasingParam;
}): void {
  for (const caret of carets.values()) {
    caret.handleTapeScroll(options);
  }
}

export function handleLineJump(options: {
  newMarginTop: number;
  duration: number;
}): void {
  for (const caret of carets.values()) {
    caret.handleLineJump(options);
  }
}

ConfigEvent.subscribe(({ key, newValue, previousValue }) => {
  if (key !== "tribeCarets") return;
  if (previousValue === newValue) return;

  if (newValue === "off") destroyAll();
  if (newValue !== "off") {
    init();
  }
  if (newValue === "on" || newValue === "noNames") {
    for (const caret of carets.values()) {
      if (newValue === "on") {
        caret.getElement().qs(".caretName")?.show();
      } else if (newValue === "noNames") {
        caret.getElement().qs(".caretName")?.hide();
      }
    }
  }
});
