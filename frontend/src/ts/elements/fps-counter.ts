import { roundTo2 } from "@monkeytype/util/numbers";

let frameCount = 0;
let fpsInterval: number;
let startTime: number;
let stopLoop = true;
const el = document.querySelector("#fpsCounter") as HTMLElement;

function loop(timestamp: number): void {
  if (stopLoop) return;
  const elapsedTime = timestamp - startTime;
  frameCount++;

  if (elapsedTime > 500) {
    const fps = roundTo2((frameCount * 1000) / elapsedTime).toFixed(2);
    frameCount = 0;
    startTime = timestamp;
    void updateElement(fps);
  }

  window.requestAnimationFrame(loop);
}

export function start(): void {
  stopLoop = false;
  frameCount = 0;
  startTime = performance.now();

  if (!fpsInterval) fpsInterval = window.requestAnimationFrame(loop);
  el.classList.remove("hidden");
}

export function stop(): void {
  cancelAnimationFrame(fpsInterval);
  stopLoop = true;
  el.classList.add("hidden");
}

async function updateElement(fps: string): Promise<void> {
  el.innerHTML = `FPS ${fps}`;
  const parsed = parseFloat(fps);
  el.classList.remove("error");
  el.classList.remove("main");
  if (parsed < 30) {
    el.classList.add("error");
  } else if (parsed > 55) {
    el.classList.add("main");
  }
}

function _getAverageFps(): number {
  return frameCount / (performance.now() - startTime);
}
