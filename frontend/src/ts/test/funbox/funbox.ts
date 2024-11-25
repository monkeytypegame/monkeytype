import * as Notifications from "../../elements/notifications";
import * as Misc from "../../utils/misc";
import * as JSONData from "../../utils/json-data";
import * as Strings from "../../utils/strings";
import * as ManualRestart from "../manual-restart-tracker";
import Config, * as UpdateConfig from "../../config";
import * as MemoryTimer from "./memory-funbox-timer";
import * as FunboxMemory from "./funbox-memory";
import {
  ConfigValue,
  HighlightMode,
} from "@monkeytype/contracts/schemas/configs";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import {
  FunboxName,
  stringToFunboxNames,
  checkCompatibility,
  FunboxMetadata,
  getFunboxObject,
  FunboxProperty,
} from "@monkeytype/funbox";

import { FunboxFunctions, getFunboxFunctions } from "./funbox-functions";
import { intersect } from "@monkeytype/util/arrays";

type FunboxMetadataWithFunctions = FunboxMetadata & {
  functions?: FunboxFunctions;
};

const metadata = getFunboxObject();
const functions = getFunboxFunctions();

const metadataWithFunctions = {} as Record<
  FunboxName,
  FunboxMetadataWithFunctions
>;

for (const [name, data] of Object.entries(metadata)) {
  metadataWithFunctions[name as FunboxName] = {
    ...data,
    functions: functions[name as FunboxName],
  };
}

export function get(funboxName: FunboxName): FunboxMetadataWithFunctions;
export function get(funboxNames: FunboxName[]): FunboxMetadataWithFunctions[];
export function get(
  funboxNameOrNames: FunboxName | FunboxName[]
): FunboxMetadataWithFunctions | FunboxMetadataWithFunctions[] {
  if (Array.isArray(funboxNameOrNames)) {
    const fns = funboxNameOrNames.map((name) => metadataWithFunctions[name]);
    return fns;
  } else {
    return metadataWithFunctions[funboxNameOrNames];
  }
}

export function getFromString(
  hashSeparatedFunboxes: string
): FunboxMetadataWithFunctions[] {
  return get(stringToFunboxNames(hashSeparatedFunboxes));
}

export function getActiveFunboxes(): FunboxMetadataWithFunctions[] {
  return get(stringToFunboxNames(Config.funbox));
}

export function getActiveFunboxNames(): FunboxName[] {
  return stringToFunboxNames(Config.funbox);
}

export function getActiveFunboxesWithProperty(
  property: FunboxProperty
): FunboxMetadataWithFunctions[] {
  return getActiveFunboxes().filter((fb) => fb.properties?.includes(property));
}

export function getActiveFunboxesWithFunction(
  functionName: keyof FunboxFunctions
): FunboxMetadataWithFunctions[] {
  return getActiveFunboxes().filter((fb) => fb.functions?.[functionName]);
}

export function checkFunboxForcedConfigs(
  key: string,
  value: ConfigValue,
  funboxes: FunboxMetadata[]
): {
  result: boolean;
  forcedConfigs?: ConfigValue[];
} {
  if (funboxes.length === 0) {
    return { result: true };
  }

  if (key === "words" || key === "time") {
    if (value === 0) {
      const fb = funboxes.filter((f) =>
        f.properties?.includes("noInfiniteDuration")
      );
      if (fb.length > 0) {
        return {
          result: false,
          forcedConfigs: [key === "words" ? 10 : 15],
        };
      } else {
        return { result: true };
      }
    } else {
      return { result: true };
    }
  } else {
    const forcedConfigs: Record<string, ConfigValue[]> = {};
    // collect all forced configs
    for (const fb of funboxes) {
      if (fb.frontendForcedConfig) {
        //push keys to forcedConfigs, if they don't exist. if they do, intersect the values
        for (const key in fb.frontendForcedConfig) {
          if (forcedConfigs[key] === undefined) {
            forcedConfigs[key] = fb.frontendForcedConfig[key] as ConfigValue[];
          } else {
            forcedConfigs[key] = intersect(
              forcedConfigs[key],
              fb.frontendForcedConfig[key] as ConfigValue[],
              true
            );
          }
        }
      }
    }

    //check if the key is in forcedConfigs, if it is check the value, if its not, return true
    if (forcedConfigs[key] === undefined) {
      return { result: true };
    } else {
      if (forcedConfigs[key]?.length === 0) {
        throw new Error("No intersection of forced configs");
      }
      return {
        result: (forcedConfigs[key] ?? []).includes(value),
        forcedConfigs: forcedConfigs[key],
      };
    }
  }
}

export function toggleScript(...params: string[]): void {
  if (Config.funbox === "none") return;

  for (const fb of getActiveFunboxes()) {
    fb.functions?.toggleScript?.(params);
  }
}

export function setFunbox(funbox: string): boolean {
  if (funbox === "none") {
    for (const fb of getActiveFunboxes()) {
      fb.functions?.clearGlobal?.();
    }
  }
  FunboxMemory.load();
  UpdateConfig.setFunbox(funbox, false);
  return true;
}

export function toggleFunbox(funbox: "none" | FunboxName): boolean {
  if (funbox === "none") setFunbox("none");
  if (
    !checkCompatibility(
      getActiveFunboxNames(),
      funbox === "none" ? undefined : funbox
    ) &&
    !Config.funbox.split("#").includes(funbox)
  ) {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        funbox.replace(/_/g, " ")
      )} funbox is not compatible with the current funbox selection`,
      0
    );
    return true;
  }
  FunboxMemory.load();
  const e = UpdateConfig.toggleFunbox(funbox, false);

  for (const fb of getActiveFunboxes()) {
    if (!Config.funbox.includes(funbox)) {
      fb.functions?.clearGlobal?.();
    } else {
      fb.functions?.applyGlobalCSS?.();
    }
  }

  //todo find out what the hell this means
  if (e === false || e === true) return false;
  return true;
}

export async function clear(): Promise<boolean> {
  $("body").attr(
    "class",
    $("body")
      ?.attr("class")
      ?.split(/\s+/)
      ?.filter((it) => !it.startsWith("fb-"))
      ?.join(" ") ?? ""
  );

  $("#funBoxTheme").removeAttr("href");

  $("#wordsWrapper").removeClass("hidden");
  MemoryTimer.reset();
  ManualRestart.set();
  return true;
}

export async function activate(funbox?: string): Promise<boolean | undefined> {
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
        `Failed to activate funbox: funboxes ${Config.funbox.replace(
          /_/g,
          " "
        )} are not compatible`
      ),
      -1
    );
    UpdateConfig.setFunbox("none", true);
    await clear();
    return false;
  }

  MemoryTimer.reset();
  await setFunboxBodyClasses();
  await applyFunboxCSS();

  $("#wordsWrapper").removeClass("hidden");

  let language;
  try {
    language = await JSONData.getCurrentLanguage(Config.language);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to activate funbox"),
      -1
    );
    UpdateConfig.setFunbox("none", true);
    await clear();
    return false;
  }

  if (language.ligatures) {
    if (
      getActiveFunboxes().find((f) => f.properties?.includes("noLigatures"))
    ) {
      Notifications.add(
        "Current language does not support this funbox mode",
        0
      );
      UpdateConfig.setFunbox("none", true);
      await clear();
      return;
    }
  }

  let canSetSoFar = true;

  for (const [configKey, configValue] of Object.entries(Config)) {
    const check = checkFunboxForcedConfigs(
      configKey,
      configValue,
      getActiveFunboxes()
    );
    if (check.result) continue;
    if (!check.result) {
      if (check.forcedConfigs && check.forcedConfigs.length > 0) {
        if (configKey === "mode") {
          UpdateConfig.setMode(check.forcedConfigs[0] as Mode);
        }
        if (configKey === "words") {
          UpdateConfig.setWordCount(check.forcedConfigs[0] as number);
        }
        if (configKey === "time") {
          UpdateConfig.setTimeConfig(check.forcedConfigs[0] as number);
        }
        if (configKey === "punctuation") {
          UpdateConfig.setPunctuation(check.forcedConfigs[0] as boolean);
        }
        if (configKey === "numbers") {
          UpdateConfig.setNumbers(check.forcedConfigs[0] as boolean);
        }
        if (configKey === "highlightMode") {
          UpdateConfig.setHighlightMode(
            check.forcedConfigs[0] as HighlightMode
          );
        }
      } else {
        canSetSoFar = false;
        break;
      }
    }
  }

  if (!canSetSoFar) {
    if (Config.funbox.includes("#")) {
      Notifications.add(
        `Failed to activate funboxes ${Config.funbox}: no intersecting forced configs. Disabling funbox`,
        -1
      );
    } else {
      Notifications.add(
        `Failed to activate funbox ${Config.funbox}: no forced configs. Disabling funbox`,
        -1
      );
    }
    UpdateConfig.setFunbox("none", true);
    await clear();
    return;
  }

  ManualRestart.set();
  for (const fb of getActiveFunboxes()) {
    fb.functions?.applyConfig?.();
  }
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  for (const fb of getActiveFunboxes()) {
    fb.functions?.rememberSettings?.();
  }
}

async function setFunboxBodyClasses(): Promise<boolean> {
  const $body = $("body");

  const activeFbClasses = getActiveFunboxNames().map(
    (name) => "fb-" + name.replaceAll("_", "-")
  );

  const currentClasses =
    $body
      ?.attr("class")
      ?.split(/\s+/)
      ?.filter((it) => !it.startsWith("fb-")) ?? [];

  $body.attr("class", [...currentClasses, ...activeFbClasses].join(" "));

  return true;
}

async function applyFunboxCSS(): Promise<boolean> {
  const $theme = $("#funBoxTheme");

  //currently we only support one active funbox with hasCSS
  const activeFunboxWithTheme = getActiveFunboxes().find((fb) =>
    fb?.properties?.includes("hasCssFile")
  );

  const activeTheme =
    activeFunboxWithTheme != null
      ? "funbox/" + activeFunboxWithTheme.name + ".css"
      : "";

  const currentTheme = ($theme.attr("href") ?? "") || null;

  if (activeTheme != currentTheme) {
    $theme.attr("href", activeTheme);
  }

  return true;
}
