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
  getAllFunboxes,
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
import * as ConfigEvent from "../../observables/config-event";

export function toggleScript(...params: string[]): void {
  if (Config.funbox.length === 0) return;

  for (const fb of getActiveFunboxesWithFunction("toggleScript")) {
    fb.functions.toggleScript(params);
  }
}

export function setFunbox(funbox: FunboxName[]): boolean {
  if (funbox.length === 0) {
    for (const fb of getActiveFunboxesWithFunction("clearGlobal")) {
      fb.functions.clearGlobal();
    }
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
  configToggleFunbox(funbox, false);

  if (!getActiveFunboxNames().includes(funbox)) {
    get(funbox).functions?.clearGlobal?.();
  } else {
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

  // The configuration might be edited with dev tools,
  // so we need to double check its validity
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
    setConfig("funbox", [], {
      nosave: true,
    });
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
    setConfig("funbox", [], {
      nosave: true,
    });
    await clear();
    return false;
  }

  if (language.ligatures) {
    if (isFunboxActiveWithProperty("noLigatures")) {
      Notifications.add(
        "Current language does not support this funbox mode",
        0,
      );
      setConfig("funbox", [], {
        nosave: true,
      });
      await clear();
      return;
    }
  }

  let canSetSoFar = true;

  for (const [configKey, configValue] of Object.entries(Config)) {
    const check = checkForcedConfig(
      configKey,
      configValue,
      getActiveFunboxes(),
    );
    if (check.result) continue;
    if (!check.result) {
      if (check.forcedConfigs && check.forcedConfigs.length > 0) {
        if (configKey === "mode") {
          setConfig("mode", check.forcedConfigs[0] as Mode);
        }
        if (configKey === "words") {
          setConfig("words", check.forcedConfigs[0] as number);
        }
        if (configKey === "time") {
          setConfig("time", check.forcedConfigs[0] as number);
        }
        if (configKey === "punctuation") {
          setConfig("punctuation", check.forcedConfigs[0] as boolean);
        }
        if (configKey === "numbers") {
          setConfig("numbers", check.forcedConfigs[0] as boolean);
        }
        if (configKey === "highlightMode") {
          setConfig("highlightMode", check.forcedConfigs[0] as HighlightMode);
        }
      } else {
        canSetSoFar = false;
        break;
      }
    }
  }

  if (!canSetSoFar) {
    if (Config.funbox.length > 1) {
      Notifications.add(
        `Failed to activate funboxes ${Config.funbox}: no intersecting forced configs. Disabling funbox`,
        -1,
      );
    } else {
      Notifications.add(
        `Failed to activate funbox ${Config.funbox}: no forced configs. Disabling funbox`,
        -1,
      );
    }
    setConfig("funbox", [], {
      nosave: true,
    });
    await clear();
    return;
  }

  ManualRestart.set();
  for (const fb of getActiveFunboxesWithFunction("applyConfig")) {
    fb.functions.applyConfig();
  }
  // ModesNotice.update();
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
    [...new Set([...currentClasses, ...activeFbClasses]).keys()].join(" "),
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

ConfigEvent.subscribe(async ({ key }) => {
  if (key === "funbox") {
    const active = getActiveFunboxNames();
    getAllFunboxes()
      .filter((it) => !active.includes(it.name))
      .forEach((it) => it.functions?.clearGlobal?.());

    for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
      fb.functions.applyGlobalCSS();
    }
  }
});
