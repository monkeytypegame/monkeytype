import "dotenv/config";
import { Counter } from "prom-client";

const auth = new Counter({
  name: "api_request_auth_total",
  help: "Counts authentication events",
  labelNames: ["type"],
});

const result = new Counter({
  name: "result_saved_total",
  help: "Counts result saves",
  labelNames: [
    "mode",
    "mode2",
    "isPb",
    "blindMode",
    "lazyMode",
    "difficulty",
    "numbers",
    "punctuation",
  ],
});

const resultLanguage = new Counter({
  name: "result_language_total",
  help: "Counts result langauge",
  labelNames: ["language"],
});

const resultFunbox = new Counter({
  name: "result_funbox_total",
  help: "Counts result funbox",
  labelNames: ["funbox"],
});

export function incrementAuth(type: "Bearer" | "ApeKey" | "None"): void {
  auth.inc({ type });
}

export function incrementResult(
  res: MonkeyTypes.Result<MonkeyTypes.Mode>
): void {
  const {
    mode,
    mode2,
    isPb,
    blindMode,
    lazyMode,
    difficulty,
    funbox,
    language,
    numbers,
    punctuation,
  } = res;

  let m2 = mode2 as string;
  if (mode === "time" && ![15, 30, 60, 120].includes(parseInt(mode2))) {
    m2 = "custom";
  }
  if (mode === "words" && ![10, 25, 50, 100].includes(parseInt(mode2))) {
    m2 = "custom";
  }
  if (mode === "quote" || mode === "zen" || mode === "custom") m2 = mode;

  result.inc({
    mode,
    mode2: m2,
    isPb: isPb ? "true" : "false",
    blindMode: blindMode ? "true" : "false",
    lazyMode: lazyMode ? "true" : "false",
    difficulty: difficulty || "normal",
    numbers: numbers ? "true" : "false",
    punctuation: punctuation ? "true" : "false",
  });

  resultLanguage.inc({
    language: language || "english",
  });

  resultFunbox.inc({
    funbox: funbox || "none",
  });
}
