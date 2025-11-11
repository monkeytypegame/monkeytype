import { engine } from "animejs";

export function applyEngineSettings(): void {
  engine.pauseOnDocumentHidden = false;
  engine.fps = 240;
  engine.defaults.frameRate = 240;
}

export function setLowFpsMode(): void {
  engine.fps = 30;
  engine.defaults.frameRate = 30;
}

export function clearLowFpsMode(): void {
  engine.fps = 240;
  engine.defaults.frameRate = 240;
}
