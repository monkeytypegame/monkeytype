import { mapRange } from "./misc";

let left = false;
let right = false;
let elements = {
  "00": document.querySelector("#monkey .up"),
  10: document.querySelector("#monkey .left"),
  "01": document.querySelector("#monkey .right"),
  11: document.querySelector("#monkey .both"),
};
let elementsFast = {
  "00": document.querySelector("#monkey .fast .up"),
  10: document.querySelector("#monkey .fast .left"),
  "01": document.querySelector("#monkey .fast .right"),
  11: document.querySelector("#monkey .fast .both"),
};
let last = "right";
// 0 up
// 1 down

function update() {
  if (!document.querySelector("#monkey").classList.contains("hidden")) {
    Object.keys(elements).forEach((key) => {
      elements[key].classList.add("hidden");
    });
    Object.keys(elementsFast).forEach((key) => {
      elementsFast[key].classList.add("hidden");
    });

    let id = left ? "1" : "0";
    id += right ? "1" : "0";

    elements[id].classList.remove("hidden");
    elementsFast[id].classList.remove("hidden");
  }
}

export function updateFastOpacity(num) {
  let opacity = mapRange(num, 100, 200, 0, 1);
  $("#monkey .fast").animate({ opacity: opacity }, 1000);
  let animDuration = mapRange(num, 100, 200, 0.5, 0.01);
  if (animDuration == 0.5) animDuration = 0;
  $("#monkey").css({ animationDuration: animDuration + "s" });
}

export function type() {
  if (!left && last == "right") {
    left = true;
    last = "left";
  } else if (!right) {
    right = true;
    last = "right";
  }
  update();
}

export function stop() {
  if (left) {
    left = false;
  } else if (right) {
    right = false;
  }
  update();
}
