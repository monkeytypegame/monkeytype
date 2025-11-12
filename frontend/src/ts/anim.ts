import { engine } from "animejs";
import { LocalStorageWithSchema } from "./utils/local-storage-with-schema";
import { z } from "zod";

const maxFps = new LocalStorageWithSchema({
  key: "maxFps",
  schema: z.number().int().min(30),
  fallback: 240,
});

export function applyEngineSettings(): void {
  engine.pauseOnDocumentHidden = false;
  engine.fps = maxFps.get();
  engine.defaults.frameRate = maxFps.get();
}

export function setLowFpsMode(): void {
  engine.fps = 30;
  engine.defaults.frameRate = 30;
}

export function clearLowFpsMode(): void {
  engine.fps = maxFps.get();
  engine.defaults.frameRate = maxFps.get();
}
