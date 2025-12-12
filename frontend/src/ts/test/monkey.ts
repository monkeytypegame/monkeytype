import { mapRange } from "@monkeytype/util/numbers";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as TestState from "../test/test-state";
import * as KeyConverter from "../utils/key-converter";
import { animate } from "animejs";

const monkeyEl = document.querySelector("#monkey") as HTMLElement;
const monkeyFastEl = document.querySelector("#monkey .fast") as HTMLElement;

ConfigEvent.subscribe(({ key }) => {
  if (key === "monkey" && TestState.isActive) {
    if (Config.monkey) {
      monkeyEl.classList.remove("hidden");
    } else {
      monkeyEl.classList.add("hidden");
    }
  }
});

let left = false;
let right = false;
const middleKeysState = { left: false, right: false, last: "right" };

// 0 hand up
// 1 hand down

// 00 both hands up
// 01 right hand down
// 10 left hand down
// 11 both hands down

const elements = {
  "00": monkeyEl.querySelector(".up"),
  "01": monkeyEl.querySelector(".right"),
  "10": monkeyEl.querySelector(".left"),
  "11": monkeyEl.querySelector(".both"),
};

const elementsFast = {
  "00": monkeyFastEl.querySelector(".up"),
  "01": monkeyFastEl.querySelector(".right"),
  "10": monkeyFastEl.querySelector(".left"),
  "11": monkeyFastEl.querySelector(".both"),
};

function toBit(b: boolean): "1" | "0" {
  return b ? "1" : "0";
}

function update(): void {
  if (!Config.monkey) return;
  if (!monkeyEl?.classList.contains("hidden")) {
    (Object.keys(elements) as (keyof typeof elements)[]).forEach((key) => {
      elements[key]?.classList.add("hidden");
    });
    (Object.keys(elementsFast) as (keyof typeof elements)[]).forEach((key) => {
      elementsFast[key]?.classList.add("hidden");
    });

    const id: keyof typeof elements = `${toBit(left)}${toBit(right)}`;

    elements[id]?.classList.remove("hidden");
    elementsFast[id]?.classList.remove("hidden");
  }
}

export function updateFastOpacity(num: number): void {
  if (!Config.monkey) return;
  const opacity = mapRange(num, 130, 180, 0, 1);
  animate(monkeyFastEl, {
    opacity: opacity,
    duration: 1000,
  });
  let animDuration = mapRange(num, 130, 180, 0.25, 0.01);
  if (animDuration === 0.25) animDuration = 0;
  monkeyEl.style.animationDuration = animDuration + "s";
}

export function type(event: JQuery.KeyDownEvent | KeyboardEvent): void {
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

export function stop(event: JQuery.KeyUpEvent | KeyboardEvent): void {
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
  monkeyEl.classList.remove("hidden");
  animate(monkeyEl, {
    opacity: [0, 1],
    duration: 125,
  });
}

export function hide(): void {
  animate(monkeyEl, {
    opacity: [1, 0],
    duration: 125,
    onComplete: () => {
      monkeyEl.classList.add("hidden");
      monkeyEl.style.animationDuration = "0s";
      monkeyFastEl.style.opacity = "0";
    },
  });
}
