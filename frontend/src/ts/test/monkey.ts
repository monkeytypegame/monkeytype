import { mapRange } from "../utils/misc";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as TestState from "../test/test-state";

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "monkey" && TestState.isActive) {
    if (Config.monkey) {
      $("#monkey").removeClass("hidden");
    } else {
      $("#monkey").addClass("hidden");
    }
  }
});

let left = false;
let right = false;

// 0 hand up
// 1 hand down

// 00 both hands up
// 01 right hand down
// 10 left hand down
// 11 both hands down

const elements = {
  "00": document.querySelector("#monkey .up"),
  "01": document.querySelector("#monkey .right"),
  "10": document.querySelector("#monkey .left"),
  "11": document.querySelector("#monkey .both"),
};

const elementsFast = {
  "00": document.querySelector("#monkey .fast .up"),
  "01": document.querySelector("#monkey .fast .right"),
  "10": document.querySelector("#monkey .fast .left"),
  "11": document.querySelector("#monkey .fast .both"),
};

let last = "right";

function toBit(b: boolean): "1" | "0" {
  return b ? "1" : "0";
}

function update(): void {
  if (!Config.monkey) return;
  if (!document.querySelector("#monkey")?.classList.contains("hidden")) {
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
  $("#monkey .fast").animate({ opacity: opacity }, 1000);
  let animDuration = mapRange(num, 130, 180, 0.25, 0.01);
  if (animDuration === 0.25) animDuration = 0;
  $("#monkey").css({ animationDuration: animDuration + "s" });
}

export function type(): void {
  if (!Config.monkey) return;
  if (!left && last === "right") {
    left = true;
    last = "left";
  } else if (!right) {
    right = true;
    last = "right";
  }
  update();
}

export function stop(): void {
  if (!Config.monkey) return;
  if (left) {
    left = false;
  } else if (right) {
    right = false;
  }
  update();
}

export function show(): void {
  if (!Config.monkey) return;
  $("#monkey")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
}

export function hide(): void {
  $("#monkey")
    .css("opacity", 1)
    .animate({ opacity: 1 }, 125, () => {
      $("#monkey").addClass("hidden");
      $("#monkey .fast").stop(true, true).css("opacity", 0);
      $("#monkey").stop(true, true).css({ animationDuration: "0s" });
    });
}
