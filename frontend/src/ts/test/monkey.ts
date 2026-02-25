import { mapRange } from "@monkeytype/util/numbers";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as TestState from "../test/test-state";
import * as KeyConverter from "../utils/key-converter";
import { qs } from "../utils/dom";

const monkeyEl = qs("#monkey");
const monkeyFastEl = qs("#monkey .fast");

ConfigEvent.subscribe(({ key }) => {
  if (key === "monkey" && TestState.isActive) {
    if (Config.monkey) {
      monkeyEl?.show();
    } else {
      monkeyEl?.hide();
    }
  }
});

let left = false;
let right = false;
const middleKeysState = { left: false, right: false, last: "right" };

const upEls = monkeyEl?.qsa(".up");
const rightEls = monkeyEl?.qsa(".right");
const leftEls = monkeyEl?.qsa(".left");
const bothEls = monkeyEl?.qsa(".both");

function update(): void {
  if (!Config.monkey) return;
  if (!monkeyEl?.hasClass("hidden")) {
    upEls?.hide();
    rightEls?.hide();
    leftEls?.hide();
    bothEls?.hide();

    if (left && right) {
      bothEls?.show();
    } else if (right) {
      rightEls?.show();
    } else if (left) {
      leftEls?.show();
    } else {
      upEls?.show();
    }
  }
}

export function updateFastOpacity(num: number): void {
  if (!Config.monkey) return;
  const opacity = mapRange(num, 130, 180, 0, 1);
  monkeyFastEl?.animate({
    opacity: opacity,
    duration: 1000,
  });
  let animDuration = mapRange(num, 130, 180, 0.25, 0.01);
  if (animDuration === 0.25) animDuration = 0;
  monkeyEl?.setStyle({ animationDuration: animDuration + "s" });
}

export function type(event: KeyboardEvent): void {
  if (!Config.monkey) return;

  const { leftSide, rightSide } = KeyConverter.keycodeToKeyboardSide(
    event.code as KeyConverter.Keycode,
  );
  if (leftSide && rightSide) {
    // if its a middle key handle special case
    if (middleKeysState.last === "left") {
      if (!right) {
        right = true;
        middleKeysState.last = "right";
        middleKeysState.right = true;
      } else if (!left) {
        left = true;
        middleKeysState.last = "left";
        middleKeysState.left = true;
      }
    } else {
      if (!left) {
        left = true;
        middleKeysState.last = "left";
        middleKeysState.left = true;
      } else if (!right) {
        right = true;
        middleKeysState.last = "right";
        middleKeysState.right = true;
      }
    }
  } else {
    // normal key set hand
    left = left || leftSide;
    right = right || rightSide;
  }

  update();
}

export function stop(event: KeyboardEvent): void {
  if (!Config.monkey) return;

  const { leftSide, rightSide } = KeyConverter.keycodeToKeyboardSide(
    event.code as KeyConverter.Keycode,
  );
  if (leftSide && rightSide) {
    // if middle key handle special case
    if (middleKeysState.left && middleKeysState.last === "left") {
      left = false;
      middleKeysState.left = false;
    } else if (middleKeysState.right && middleKeysState.last === "right") {
      right = false;
      middleKeysState.right = false;
    } else {
      left = left && !middleKeysState.left;
      right = right && !middleKeysState.right;
    }
  } else {
    // normal key unset hand
    left = left && !leftSide;
    right = right && !rightSide;
  }

  update();
}

export function show(): void {
  if (!Config.monkey) return;
  monkeyEl?.show();
  monkeyEl?.animate({
    opacity: [0, 1],
    duration: 125,
  });
}

export function hide(): void {
  monkeyEl?.animate({
    opacity: [1, 0],
    duration: 125,
    onComplete: () => {
      monkeyEl?.hide();
      monkeyEl?.setStyle({ animationDuration: "0s" });
      monkeyFastEl?.setStyle({ opacity: "0" });
    },
  });
}

export function instantHide(): void {
  monkeyEl?.hide();
  monkeyEl?.setStyle({ opacity: "0" });
  monkeyEl?.setStyle({ animationDuration: "0s" });
  monkeyFastEl?.setStyle({ opacity: "0" });
}
