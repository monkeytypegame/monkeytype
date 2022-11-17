import * as Notifications from "../../elements/notifications";
import * as Misc from "../../utils/misc";
import * as ManualRestart from "../manual-restart-tracker";
import Config, * as UpdateConfig from "../../config";
import * as MemoryTimer from "./memory-funbox-timer";
import * as FunboxMemory from "./funbox-memory";
import * as FunboxList from "./funbox-list";

export function toggleScript(...params: string[]): void {
  FunboxList.getActive().forEach((funbox) => {
    if (funbox.functions?.toggleScript) funbox.functions.toggleScript(params);
  });
}

export function isFunboxCompatible(funbox?: string): boolean {
  if (funbox === "none" || Config.funbox === "none") return true;
  let checkingFunbox = FunboxList.getActive();
  if (funbox !== undefined) {
    checkingFunbox = checkingFunbox.concat(
      FunboxList.getAll().filter((f) => f.name == funbox)
    );
  }

  const allFunboxesAreValid =
    FunboxList.getActive().filter(
      (f) => Config.funbox.split("#").find((cf) => cf == f.name) !== undefined
    ).length == Config.funbox.split("#").length;
  const oneWordModifierMax =
    checkingFunbox.filter(
      (f) =>
        f.functions?.getWord ||
        f.functions?.pullSection ||
        f.functions?.withWords
    ).length <= 1;
  const layoutUsability =
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "changesLayout")
    ).length == 0 ||
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "ignoresLayout" || fp == "usesLayout")
    ).length == 0;
  const oneNospaceOrToPushMax =
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "nospace" || fp.startsWith("toPush"))
    ).length <= 1;
  const oneChangesWordsVisibilityMax =
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "changesWordsVisibility")
    ).length <= 1;
  const capitalisationChangePosibility =
    checkingFunbox.filter((f) => f.properties?.find((fp) => fp == "noLetters"))
      .length == 0 ||
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "changesCapitalisation")
    ).length == 0;
  const noConflictsWithSymmetricChars =
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "conflictsWithSymmetricChars")
    ).length == 0 ||
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "symmetricChars")
    ).length == 0;
  const canSpeak =
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "speaks" || fp == "unspeakable")
    ).length <= 1;
  const hasLanguageToSpeak =
    checkingFunbox.filter((f) => f.properties?.find((fp) => fp == "speaks"))
      .length == 0 ||
    checkingFunbox.filter((f) =>
      f.properties?.find((fp) => fp == "ignoresLanguage")
    ).length == 0;
  const oneToPushOrPullSectionMax =
    checkingFunbox.filter(
      (f) =>
        f.properties?.find((fp) => fp.startsWith("toPush:")) ||
        f.functions?.pullSection
    ).length <= 1;
  const oneApplyCSSMax =
    checkingFunbox.filter((f) => f.functions?.applyCSS).length <= 1;
  const onePunctuateWordMax =
    checkingFunbox.filter((f) => f.functions?.punctuateWord).length <= 1;
  const oneCharCheckerMax =
    checkingFunbox.filter((f) => f.functions?.isCharCorrect).length <= 1;
  const oneCharReplacerMax =
    checkingFunbox.filter((f) => f.functions?.getWordHtml).length <= 1;
  let allowedModes: MonkeyTypes.Mode[] | undefined;
  for (const f of checkingFunbox) {
    if (f.mode) {
      if (allowedModes) {
        allowedModes = allowedModes.filter((m) => f.mode?.includes(m));
      } else {
        allowedModes = f.mode;
      }
    }
  }
  const noModesConflicts = allowedModes?.length !== 0;
  const allowedConfig = {} as MonkeyTypes.FunboxForcedConfig;
  let noConfigConflicts = true;
  for (const f of checkingFunbox) {
    if (!f.forcedConfig) continue;
    for (const key in f.forcedConfig) {
      if (allowedConfig[key]) {
        if (
          Misc.intersect(allowedConfig[key], f.forcedConfig[key], true)
            .length === 0
        ) {
          noConfigConflicts = false;
          break;
        }
      } else {
        allowedConfig[key] = f.forcedConfig[key];
      }
    }
  }

  return (
    allFunboxesAreValid &&
    oneWordModifierMax &&
    layoutUsability &&
    oneNospaceOrToPushMax &&
    oneChangesWordsVisibilityMax &&
    capitalisationChangePosibility &&
    noConflictsWithSymmetricChars &&
    canSpeak &&
    hasLanguageToSpeak &&
    oneToPushOrPullSectionMax &&
    oneApplyCSSMax &&
    onePunctuateWordMax &&
    oneCharCheckerMax &&
    oneCharReplacerMax &&
    noModesConflicts &&
    noConfigConflicts
  );
}

export function setFunbox(funbox: string): boolean {
  FunboxMemory.load();
  UpdateConfig.setFunbox(funbox, false);
  return true;
}

export function toggleFunbox(funbox: string): boolean {
  if (funbox == "none") setFunbox("none");
  if (
    !isFunboxCompatible(funbox) &&
    !Config.funbox.split("#").includes(funbox)
  ) {
    Notifications.add(
      `Can not apply the ${funbox.replace(/_/g, " ")} funbox`,
      0
    );
    return true;
  }
  FunboxMemory.load();
  const e = UpdateConfig.toggleFunbox(funbox, false);
  if (e === false || e === true) return false;
  return true;
}

export async function clear(): Promise<boolean> {
  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  $("#wordsWrapper").removeClass("hidden");
  MemoryTimer.reset();
  ManualRestart.set();
  return true;
}

function checkActiveFunboxesForcedConfigs(
  configKey?: string,
  configValue?: MonkeyTypes.ConfigValues
): void {
  if (configKey === undefined || configValue === undefined) {
    for (const [key, value] of Object.entries(Config)) {
      checkActiveFunboxesForcedConfigs(key, value);
    }
  } else {
    for (const activeFunbox of FunboxList.getActive()) {
      const forcedConfigValues = activeFunbox.forcedConfig?.[configKey];
      if (forcedConfigValues && !forcedConfigValues.includes(configValue)) {
        Notifications.add(
          `The ${activeFunbox.name} funbox does not allow ${configKey}: ${configValue}`,
          0
        );
        if (configKey == "highlightMode") {
          UpdateConfig.setHighlightMode(
            forcedConfigValues[0] as MonkeyTypes.HighlightMode
          );
        }
        if (configKey == "punctuation") {
          UpdateConfig.setPunctuation(forcedConfigValues[0] as boolean);
        }
        if (configKey == "numbers") {
          UpdateConfig.setNumbers(forcedConfigValues[0] as boolean);
        }
      }
    }
  }
}

export async function activate(funbox?: string): Promise<boolean | undefined> {
  if (funbox === undefined || funbox === null) {
    funbox = Config.funbox;
  } else if (Config.funbox != funbox) {
    Config.funbox = funbox;
  }

  // The configuration might be edited with dev tools,
  // so we need to double check its validity
  if (!isFunboxCompatible()) {
    Notifications.add(
      Misc.createErrorMessage(undefined, "Failed to activate funbox"),
      -1
    );
    UpdateConfig.setFunbox("none", true);
    await clear();
    return false;
  }

  MemoryTimer.reset();
  $("#wordsWrapper").removeClass("hidden");
  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");

  let fb: MonkeyTypes.FunboxObject[] = [];
  fb = fb.concat(
    FunboxList.getActive().filter(
      (f) => f.mode !== undefined && !f.mode.includes(Config.mode)
    )
  );
  if (Config.mode === "zen") {
    fb = fb.concat(
      FunboxList.getActive().filter(
        (f) =>
          f.functions?.getWord ||
          f.functions?.pullSection ||
          f.functions?.alterText ||
          f.functions?.withWords ||
          f.properties?.includes("changesCapitalisation") ||
          f.properties?.includes("nospace") ||
          f.properties?.find((fp) => fp.startsWith("toPush:")) ||
          f.properties?.includes("changesWordsVisibility") ||
          f.properties?.includes("speaks") ||
          f.properties?.includes("changesLayout")
      )
    );
  }
  if (Config.mode === "quote" || Config.mode == "custom") {
    fb = fb.concat(
      FunboxList.getActive().filter(
        (f) =>
          f.functions?.getWord ||
          f.functions?.pullSection ||
          f.functions?.withWords
      )
    );
  }
  if (fb.length > 0) {
    Notifications.add(
      `${Misc.capitalizeFirstLetterOfEachWord(
        Config.mode
      )} mode does not support the ${fb[0].name.replace(/_/g, " ")} funbox`,
      0
    );
    const mode = fb.find((f) => f.mode)?.mode;
    if (mode) {
      UpdateConfig.setMode(mode[0], true);
    } else {
      UpdateConfig.setMode("time", true);
    }
  }

  let language;
  try {
    language = await Misc.getCurrentLanguage(Config.language);
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
      FunboxList.getActive().find((f) => f.properties?.includes("noLigatures"))
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

  if (Config.time === 0 && Config.mode === "time") {
    const fb = FunboxList.getActive().filter((f) =>
      f.properties?.includes("noInfiniteDuration")
    );
    if (fb.length > 0) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode with value 0 does not support the ${fb[0].name.replace(
          /_/g,
          " "
        )} funbox`,
        0
      );
      UpdateConfig.setTimeConfig(15, true);
    }
  }

  if (Config.words === 0 && Config.mode === "words") {
    const fb = FunboxList.getActive().filter((f) =>
      f.properties?.includes("noInfiniteDuration")
    );
    if (fb.length > 0) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode with value 0 does not support the ${fb[0].name.replace(
          /_/g,
          " "
        )} funbox`,
        0
      );
      UpdateConfig.setWordCount(10, true);
    }
  }

  checkActiveFunboxesForcedConfigs();

  ManualRestart.set();
  FunboxList.getActive().forEach(async (funbox) => {
    if (funbox.functions?.applyCSS) funbox.functions.applyCSS();
    if (funbox.functions?.applyConfig) funbox.functions.applyConfig();
  });
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  FunboxList.getActive().forEach(async (funbox) => {
    if (funbox.functions?.rememberSettings) funbox.functions.rememberSettings();
  });
}
