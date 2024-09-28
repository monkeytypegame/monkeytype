import { mapRange } from "@monkeytype/util/numbers";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as TestState from "../test/test-state";
import * as JSONData from "../utils/json-data";
import * as LayoutEmulator from "../test/layout-emulator";

class HandMap {
  private leftHandSet: Set<string>;
  private rightHandSet: Set<string>;

  constructor() {
    this.leftHandSet = new Set();
    this.rightHandSet = new Set();
    void this.update(Config.layout);
  }

  async update(layoutName: string): Promise<void> {
    if (layoutName === "default") {
      layoutName = "qwerty";
    }
    const layout = await JSONData.getLayout(layoutName).catch(() => undefined);
    if (layout === undefined) {
      throw new Error(`Failed to load layout: ${layoutName}`);
    }

    this.leftHandSet.clear();
    this.rightHandSet.clear();

    Object.values(layout.keys).forEach((rowArray) => {
      const midpoint = Math.floor(rowArray.length / 2);
      rowArray.forEach((keyString, index) => {
        const targetSet =
          index < midpoint ? this.leftHandSet : this.rightHandSet;
        if (keyString.length === 1) {
          targetSet.add(keyString);
        } else if (keyString.length === 2) {
          targetSet.add(keyString.charAt(0));
          targetSet.add(keyString.charAt(1));
        } else {
          console.error(`Unexpected key format: ${keyString}`);
        }
      });
    });
  }

  getHand(key: string): "left" | "right" | "unknown" {
    if (this.leftHandSet.has(key)) return "left";
    if (this.rightHandSet.has(key)) return "right";
    return "unknown";
  }
}

const handMap = new HandMap();

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "monkey" && TestState.isActive) {
    if (Config.monkey) {
      $("#monkey").removeClass("hidden");
    } else {
      $("#monkey").addClass("hidden");
    }
  }
  if (Config.monkey && eventKey === "layout") {
    void handMap.update(Config.layout);
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

export async function type(event: JQuery.KeyDownEvent): Promise<void> {
  if (!Config.monkey) return;
  let char;
  if (Config.layout === "default") {
    char = event.key;
  } else {
    char = await LayoutEmulator.getCharFromEvent(event);
  }
  if (char === null) return;

  const MonkeyHand = handMap.getHand(char);
  if (MonkeyHand === "left" || char === " ") {
    left = true;
  }
  if (MonkeyHand === "right" || char === " ") {
    right = true;
  }
  update();
}

export async function stop(event: JQuery.KeyUpEvent): Promise<void> {
  if (!Config.monkey) return;
  let char;
  if (Config.layout === "default") {
    char = event.key;
  } else {
    char = await LayoutEmulator.getCharFromEvent(event);
  }
  if (char === null) return;

  const MonkeyHand = handMap.getHand(char);
  if (MonkeyHand === "left" || char === " ") {
    left = false;
  }
  if (MonkeyHand === "right" || char === " ") {
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
