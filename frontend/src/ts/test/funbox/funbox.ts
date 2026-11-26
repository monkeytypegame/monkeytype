import {
  showNoticeNotification,
  showErrorNotification,
} from "../../states/notifications";
import * as JSONData from "../../utils/json-data";
import * as Strings from "../../utils/strings";
import { getConfig } from "../../config/store";
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
import { createRoot } from "solid-js";
import { createEffectOn } from "../../hooks/effects";
import { getVisiblePage } from "../../states/router";

export function toggleScript(...params: string[]): void {
  if (getConfig.funbox.length === 0) return;

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
    !getConfig.funbox.includes(funbox)
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

// when the page unmounts it stays visible through its animation
// this clears funboxes only after it finished animating
createRoot(() => {
  createEffectOn(getVisiblePage, (page) => {
    if (page !== "test") void clear();
  });
});

export async function activate(
  funbox?: FunboxName[],
): Promise<boolean | undefined> {
  if (funbox !== undefined && getConfig.funbox !== funbox) {
    setConfig("funbox", funbox, { nosave: true });
  }

  // The configuration might be edited with dev tools,
  // so we need to double check its validity
  if (!checkCompatibility(getActiveFunboxNames())) {
    showErrorNotification(
      `Failed to activate funbox: funboxes ${getConfig.funbox
        .map((it) => it.replace(/_/g, " "))
        .join(", ")} are not compatible`,
    );
    setConfig("funbox", [], {
      nosave: true,
    });
    await clear();
    return false;
  }

  const unsupported = getConfig.funbox.filter(
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
      getConfig.funbox.filter((it) => !unsupported.includes(it)),
    );
  }

  setMemoryTimerDuration(null);
  // a copy: the config's funbox array is the store's, updated in place
  setAppliedFunboxes([...getActiveFunboxNames()]);

  setWordsWrapperHidden(false);

  const { data: language, error } = await tryCatch(
    JSONData.getCurrentLanguage(getConfig.language),
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

  for (const [configKey, configValue] of Object.entries(getConfig)) {
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
    if (getConfig.funbox.length > 1) {
      showErrorNotification(
        `Failed to activate funboxes ${getConfig.funbox}: no intersecting forced configs. Disabling funbox`,
      );
    } else {
      showErrorNotification(
        `Failed to activate funbox ${getConfig.funbox}: no forced configs. Disabling funbox`,
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
