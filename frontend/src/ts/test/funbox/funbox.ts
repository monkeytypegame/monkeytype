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
import * as FunboxMemory from "./funbox-memory";
import { HighlightMode, FunboxName } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { checkCompatibility, checkForcedConfig } from "@monkeytype/funbox";
import {
  getActiveFunboxes,
  getActiveFunboxNames,
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
} from "./list";
import { tryCatch } from "@monkeytype/util/trycatch";
import {
  setAppliedFunboxes,
  setMemoryTimerDuration,
  setWordsWrapperHidden,
} from "../../states/test";
import { getFunboxUnsupportedReason } from "../../config/funbox-validation";

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
  setAppliedFunboxes([]);
  setWordsWrapperHidden(false);
  setMemoryTimerDuration(null);
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

  const unsupported = Config.funbox.filter(
    (it) => getFunboxUnsupportedReason(it) !== undefined,
  );
  for (const fb of unsupported) {
    showNoticeNotification(getFunboxUnsupportedReason(fb) as string, {
      durationMs: 5000,
    });
  }
  if (unsupported.length > 0) {
    setConfig(
      "funbox",
      Config.funbox.filter((it) => !unsupported.includes(it)),
    );
  }

  setMemoryTimerDuration(null);
  setAppliedFunboxes(getActiveFunboxNames());

  setWordsWrapperHidden(false);

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

  if (language.joiningScript) {
    if (isFunboxActiveWithProperty("noJoiningScript")) {
      showNoticeNotification(
        "Current language does not support this funbox mode",
      );
      setConfig("funbox", [], {
        nosave: true,
      });
      await clear();
      return undefined;
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
    return undefined;
  }

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
