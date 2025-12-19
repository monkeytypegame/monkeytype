import { engine } from "animejs";
import { LocalStorageWithSchema } from "./utils/local-storage-with-schema";
import { z } from "zod";

export const fpsLimitSchema = z.number().int().min(15).max(1000);

const fpsLimit = new LocalStorageWithSchema({
  key: "fpsLimit",
  schema: fpsLimitSchema,
  fallback: 1000,
});

export function setfpsLimit(fps: number): boolean {
  const result = fpsLimit.set(fps);
  applyEngineSettings();
  return result;
}

export function getfpsLimit(): number {
  return fpsLimit.get();
}

export function applyEngineSettings(): void {
  engine.pauseOnDocumentHidden = false;
  engine.fps = fpsLimit.get();
  engine.defaults.frameRate = fpsLimit.get();
}

export function setLowFpsMode(): void {
  engine.fps = 30;
  engine.defaults.frameRate = 30;
}

export function clearLowFpsMode(): void {
  engine.fps = fpsLimit.get();
  engine.defaults.frameRate = fpsLimit.get();
}
