import * as Notifications from "../../elements/notifications";
import * as Misc from "../../utils/misc";
import * as JSONData from "../../utils/json-data";
import * as Strings from "../../utils/strings";
import * as ManualRestart from "../manual-restart-tracker";
import Config, * as UpdateConfig from "../../config";
import * as MemoryTimer from "./memory-funbox-timer";
import * as FunboxMemory from "./funbox-memory";
import { checkFunboxForcedConfigs } from "./funbox-validation";
import { HighlightMode } from "@monkeytype/contracts/schemas/configs";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import {
  FunboxName,
  stringToFunboxNames,
  checkCompatibility,
  FunboxMetadata,
  getFunboxObject,
} from "@monkeytype/funbox";

import { FunboxFunctions, getFunboxFunctions } from "./funbox-functions";

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

export function getActive(): FunboxMetadataWithFunctions[] {
  return get(stringToFunboxNames(Config.funbox));
}

export function toggleScript(...params: string[]): void {
  if (Config.funbox === "none") return;

  for (const fb of getActive()) {
    fb.functions?.toggleScript?.(params);
  }
}

export function setFunbox(funbox: string): boolean {
  if (funbox === "none") {
    for (const fb of getActive()) {
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
      stringToFunboxNames(Config.funbox),
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

  for (const fb of getActive()) {
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
  if (!checkCompatibility(stringToFunboxNames(Config.funbox))) {
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
    if (getActive().find((f) => f.properties?.includes("noLigatures"))) {
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
      Config.funbox
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
  for (const fb of getActive()) {
    fb.functions?.applyConfig?.();
  }
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  for (const fb of getActive()) {
    fb.functions?.rememberSettings?.();
  }
}

async function setFunboxBodyClasses(): Promise<boolean> {
  const $body = $("body");

  const activeFbClasses = getActive().map(
    (fb) => "fb-" + fb.name.replaceAll("_", "-")
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
  const activeFunboxWithTheme = getActive().find((fb) =>
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
