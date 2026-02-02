import * as Notifications from "../../elements/notifications";
import * as Misc from "../../utils/misc";
import * as JSONData from "../../utils/json-data";
import * as Strings from "../../utils/strings";
import * as ManualRestart from "../manual-restart-tracker";
import Config, {
  setConfig,
  toggleFunbox as configToggleFunbox,
} from "../../config";
import * as MemoryTimer from "./memory-funbox-timer";
import * as FunboxMemory from "./funbox-memory";
import { HighlightMode, FunboxName } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { checkCompatibility } from "@monkeytype/funbox";
import {
  getActiveFunboxes,
  getActiveFunboxNames,
  get,
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
  getActiveFunboxesWithProperty,
} from "./list";
import { checkForcedConfig } from "./funbox-validation";
import { tryCatch } from "@monkeytype/util/trycatch";
import { qs } from "../../utils/dom";

export function toggleScript(...params: string[]): void {
  if (Config.funbox.length === 0) return;

  for (const fb of getActiveFunboxesWithFunction("toggleScript")) {
    fb.functions.toggleScript(params);
  }
}

export function setFunbox(funbox: FunboxName[]): boolean {
  const previousFunboxes = getActiveFunboxNames();

  const removedFunboxes = previousFunboxes.filter((fb) => !funbox.includes(fb));

  for (const fb of removedFunboxes) {
    get(fb).functions?.clearGlobal?.();
  }

  FunboxMemory.load();
  setConfig("funbox", funbox);
  return true;
}

export function toggleFunbox(funbox: FunboxName): void {
  if (
    !checkCompatibility(getActiveFunboxNames(), funbox) &&
    !Config.funbox.includes(funbox)
  ) {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        funbox.replace(/_/g, " "),
      )} funbox is not compatible with the current funbox selection`,
      0,
    );
    return;
  }

  FunboxMemory.load();

  const wasActive = getActiveFunboxNames().includes(funbox);

  configToggleFunbox(funbox, false);

  const isActive = getActiveFunboxNames().includes(funbox);

  if (wasActive && !isActive) {
    get(funbox).functions?.clearGlobal?.();
  }

  if (!wasActive && isActive) {
    get(funbox).functions?.applyGlobalCSS?.();
  }
}

export async function clear(): Promise<boolean> {
  qs("body")?.setAttribute(
    "class",
    qs("body")
      ?.getAttribute("class")
      ?.split(/\s+/)
      ?.filter((it) => !it.startsWith("fb-"))
      ?.join(" ") ?? "",
  );

  qs(".funBoxTheme")?.remove();
  qs("#wordsWrapper")?.show();

  MemoryTimer.reset();
  ManualRestart.set();
  return true;
}

export async function activate(
  funbox?: FunboxName[],
): Promise<boolean | undefined> {
  if (funbox === undefined || funbox === null) {
    funbox = Config.funbox;
  } else if (Config.funbox !== funbox) {
    Config.funbox = funbox;
  }

  if (!checkCompatibility(getActiveFunboxNames())) {
    Notifications.add(
      Misc.createErrorMessage(
        undefined,
        `Failed to activate funbox: funboxes ${Config.funbox
          .map((it) => it.replace(/_/g, " "))
          .join(", ")} are not compatible`,
      ),
      -1,
    );
    setConfig("funbox", [], { nosave: true });
    await clear();
    return false;
  }

  MemoryTimer.reset();
  await setFunboxBodyClasses();
  await applyFunboxCSS();

  qs("#wordsWrapper")?.show();

  const { data: language, error } = await tryCatch(
    JSONData.getCurrentLanguage(Config.language),
  );

  if (error) {
    Notifications.add(
      Misc.createErrorMessage(error, "Failed to activate funbox"),
      -1,
    );
    setConfig("funbox", [], { nosave: true });
    await clear();
    return false;
  }

  if (language.ligatures && isFunboxActiveWithProperty("noLigatures")) {
    Notifications.add("Current language does not support this funbox mode", 0);
    setConfig("funbox", [], { nosave: true });
    await clear();
    return;
  }

  let canSetSoFar = true;

  for (const [configKey, configValue] of Object.entries(Config)) {
    const check = checkForcedConfig(
      configKey,
      configValue,
      getActiveFunboxes(),
    );

    if (check.result) continue;

    const value = check.forcedConfigs?.[0];

    if (value === undefined) {
      canSetSoFar = false;
      break;
    }

    if (configKey === "mode" && typeof value === "string") {
      setConfig("mode", value as Mode);
    }

    if (configKey === "words" && typeof value === "number") {
      setConfig("words", value);
    }

    if (configKey === "time" && typeof value === "number") {
      setConfig("time", value);
    }

    if (configKey === "punctuation" && typeof value === "boolean") {
      setConfig("punctuation", value);
    }

    if (configKey === "numbers" && typeof value === "boolean") {
      setConfig("numbers", value);
    }

    if (configKey === "highlightMode" && typeof value === "string") {
      setConfig("highlightMode", value as HighlightMode);
    }
  }

  if (!canSetSoFar) {
    Notifications.add(
      `Failed to activate funbox: no intersecting forced configs. Disabling funbox`,
      -1,
    );
    setConfig("funbox", [], { nosave: true });
    await clear();
    return;
  }

  ManualRestart.set();

  for (const fb of getActiveFunboxesWithFunction("applyConfig")) {
    fb.functions.applyConfig();
  }

  return true;
}

export async function rememberSettings(): Promise<void> {
  for (const fb of getActiveFunboxesWithFunction("rememberSettings")) {
    fb.functions.rememberSettings();
  }
}

async function setFunboxBodyClasses(): Promise<boolean> {
  const body = qs("body");

  const activeFbClasses = getActiveFunboxNames().map(
    (name) => "fb-" + name.replaceAll("_", "-"),
  );

  const currentClasses =
    body
      ?.getAttribute("class")
      ?.split(/\s+/)
      .filter((it) => !it.startsWith("fb-")) ?? [];

  if (isFunboxActiveWithProperty("ignoreReducedMotion")) {
    currentClasses.push("ignore-reduced-motion");
  }

  body?.setAttribute(
    "class",
    [...new Set([...currentClasses, ...activeFbClasses])].join(" "),
  );

  return true;
}

async function applyFunboxCSS(): Promise<boolean> {
  qs(".funBoxTheme")?.remove();

  for (const funbox of getActiveFunboxesWithProperty("hasCssFile")) {
    const css = document.createElement("link");
    css.classList.add("funBoxTheme");
    css.rel = "stylesheet";
    css.href = "funbox/" + funbox.name + ".css";
    document.head.appendChild(css);
  }

  return true;
}
