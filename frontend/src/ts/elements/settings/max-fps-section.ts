// import { debounce } from "throttle-debounce";
import { getMaxFps, setMaxFps } from "../../anim";
import * as Notifications from "../notifications";

const section = document.querySelector(
  "#pageSettings .section.maxFps"
) as HTMLElement;

export function update(): void {
  for (const button of section.querySelectorAll("button")) {
    button.classList.remove("active");
  }
  const maxFps = getMaxFps();
  const button = section.querySelector(`button[data-maxfps="${maxFps}"]`);
  if (button) {
    button.classList.add("active");
  }
}

for (const button of section.querySelectorAll("button")) {
  button.addEventListener("click", () => {
    const fpsString = button.getAttribute("data-maxfps");
    if (fpsString === null || fpsString === "") return;
    const fps = parseInt(fpsString, 10);
    if (isNaN(fps)) return;
    setMaxFps(fps);
    update();
    Notifications.add("Max FPS updated", 0);
  });
}

// let value = 240;

// export function update(): void {
//   const maxFps = getMaxFps();
//   value = maxFps;

//   const rangeInput = section.querySelector(
//     'input[type="range"]'
//   ) as HTMLInputElement;
//   const valueDisplay = section.querySelector(".value") as HTMLElement;

//   let str = maxFps.toString();
//   if (maxFps >= 1000) {
//     str = "unlimited";
//   }

//   rangeInput.value = value.toString();
//   valueDisplay.textContent = str;
// }

// const debounced = debounce(125, () => {
//   const fps = parseInt(rangeInput.value, 10);
//   setMaxFps(fps);
//   update();
//   Notifications.add("Max FPS updated", 0);
// });

// const rangeInput = section.querySelector(
//   'input[type="range"]'
// ) as HTMLInputElement;

// rangeInput.addEventListener("input", () => {
//   const valueDisplay = section.querySelector(".value") as HTMLElement;
//   valueDisplay.textContent = rangeInput.value;
//   debounced();
// });
