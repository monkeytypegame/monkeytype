import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import * as JSONData from "../../utils/json-data";
import * as Strings from "../../utils/strings";
import { Config } from "../../config/store";
import {
  toggleFunbox as configToggleFunbox,
  setConfig,
} from "../../config/setters";
import * as MemoryTimer from "./memory-funbox-timer";
import * as FunboxMemory from "./funbox-memory";
import { HighlightMode, FunboxName } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { checkCompatibility, checkForcedConfig } from "@monkeytype/funbox";
import {
  getAllFunboxes,
  getActiveFunboxes,
  getActiveFunboxNames,
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
  getActiveFunboxesWithProperty,
} from "./list";
import { tryCatch } from "@monkeytype/util/trycatch";
import { qs, qsa } from "../../utils/dom";
import { configEvent } from "../../events/config";

export function toggleScript(...params: string[]): void {
  if (Config.funbox.length === 0) return;

  for (const fb of getActiveFunboxesWithFunction("toggleScript")) {
    fb.functions.toggleScript(params);
  }
}

export function setFunbox(funbox: FunboxName[]): boolean {
  FunboxMemory.load();
  setConfig("funbox", funbox);
  return true;
}

export function toggleFunbox(funbox: FunboxName): void {
  if (
    !checkCompatibility(getActiveFunboxNames(), funbox) &&
    !Config.funbox.includes(funbox)
  ) {
    showNoticeNotification(
      `${Strings.capitalizeFirstLetter(
        funbox.replace(/_/g, " "),
      )} funbox is not compatible with the current funbox selection`,
    );
    return;
  }
  FunboxMemory.load();
  configToggleFunbox(funbox, false);
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

  qsa(".funBoxTheme").remove();

  qs("#wordsWrapper")?.show();
  MemoryTimer.reset();
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
    showErrorNotification(
      `Failed to activate funbox: funboxes ${Config.funbox
        .map((it) => it.replace(/_/g, " "))
        .join(", ")} are not compatible`,
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
    showErrorNotification("Failed to activate funbox", { error });
    setConfig("funbox", [], {
      nosave: true,
    });
    await clear();
    return false;
  }

  if (language.ligatures) {
    if (isFunboxActiveWithProperty("noLigatures")) {
      showNoticeNotification(
        "Current language does not support this funbox mode",
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
      showErrorNotification(
        `Failed to activate funboxes ${Config.funbox}: no intersecting forced configs. Disabling funbox`,
      );
    } else {
      showErrorNotification(
        `Failed to activate funbox ${Config.funbox}: no forced configs. Disabling funbox`,
      );
    }
    setConfig("funbox", [], {
      nosave: true,
    });
    await clear();
    return;
  }

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
  qsa(".funBoxTheme").remove();
  for (const funbox of getActiveFunboxesWithProperty("hasCssFile")) {
    const css = document.createElement("link");
    css.classList.add("funBoxTheme");
    css.rel = "stylesheet";
    css.href = "funbox/" + funbox.name + ".css";
    document.head.appendChild(css);
  }
  return true;
}

configEvent.subscribe(async ({ key }) => {
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
