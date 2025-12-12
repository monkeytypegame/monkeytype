import Config, * as UpdateConfig from "../config";
import * as Funbox from "../test/funbox/funbox";
// import * as Notifications from "./notifications";
// import * as CustomText from "../test/custom-text";
import * as TribeConfigSyncEvent from "../observables/tribe-config-sync-event";
import * as TribeButtons from "./tribe-buttons";
import * as TribeState from "../tribe/tribe-state";
import tribeSocket from "./tribe-socket";
import * as TribeTypes from "./types";
import { Difficulty, Mode } from "@monkeytype/schemas/shared";
import {
  FunboxName,
  QuoteLengthConfig,
  StopOnError,
} from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";

export function getArray(config: TribeTypes.RoomConfig): string[] {
  const ret: string[] = [];

  if (config["mode"] === "quote") {
    const mode2 = config["mode2"] as number[];
    let quoteLengthString = "";
    if (mode2.length === 4) {
      quoteLengthString = "";
    } else {
      mode2.forEach((ql: number) => {
        if (ql === 0) {
          quoteLengthString += "short,";
        } else if (ql === 1) {
          quoteLengthString += "medium,";
        } else if (ql === 2) {
          quoteLengthString += "long,";
        } else if (ql === 3) {
          quoteLengthString += "thicc,";
        }
      });
      quoteLengthString = quoteLengthString.substring(
        0,
        quoteLengthString.length - 1,
      );
    }
    if (quoteLengthString !== "") ret.push(quoteLengthString);
    ret.push("quote");
  } else {
    ret.push(config["mode"]);
    ret.push(config["mode2"] as unknown as string);
  }

  if (config["difficulty"] !== "normal") ret.push(config["difficulty"]);
  // if(config['language'] !== "english")
  ret.push(config["language"]);
  if (config["punctuation"]) ret.push("punctuation");
  if (config["numbers"]) ret.push("numbers");
  if (config["funbox"].length > 0) ret.push(config["funbox"].join(","));
  if (config["lazyMode"]) ret.push("lazy mode");
  if (config["stopOnError"] !== "off") {
    ret.push("stop on " + config["stopOnError"] === "word" ? "word" : "letter");
  }
  if (config["minWpm"] !== "off") ret.push(`min ${config["minWpm"]}wpm`);
  if (config["minAcc"] !== "off") ret.push(`min ${config["minAcc"]}% acc`);
  if (config["minBurst"] !== "off") {
    ret.push(`min ${config["minBurst"]}wpm burst`);
  }

  return ret;
}

export function apply(config: TribeTypes.RoomConfig): void {
  const setOptions = {
    nosave: true,
    tribeOverride: true,
  };

  UpdateConfig.setConfig("mode", config.mode as Mode, setOptions);
  if (config.mode === "time") {
    UpdateConfig.setConfig("time", config.mode2 as number, setOptions);
  } else if (config.mode === "words") {
    UpdateConfig.setConfig("words", config.mode2 as number, setOptions);
  } else if (config.mode === "quote") {
    UpdateConfig.setConfig(
      "quoteLength",
      config.mode2 as QuoteLengthConfig,
      setOptions,
    );
  } else if (config.mode === "custom") {
    //todo fix
    // CustomText.setText(config.customText.text, true);
    // CustomText.setIsWordRandom(config.customText.isWordRandom, true);
    // CustomText.setIsTimeRandom(config.customText.isTimeRandom, true);
    // CustomText.setTime(config.customText.time, true);
    // CustomText.setWord(config.customText.word, true);
  }
  UpdateConfig.setConfig("difficulty", config.difficulty as Difficulty, {
    nosave: true,
    tribeOverride: true,
  });
  UpdateConfig.setConfig("language", config.language as Language, {
    nosave: true,
    tribeOverride: true,
  });
  UpdateConfig.setConfig("punctuation", config.punctuation, {
    nosave: true,
    tribeOverride: true,
  });
  UpdateConfig.setConfig("numbers", config.numbers, {
    nosave: true,
    tribeOverride: true,
  });
  Funbox.setFunbox(config.funbox as FunboxName[], true);
  UpdateConfig.setConfig("lazyMode", config.lazyMode, {
    nosave: true,
    tribeOverride: true,
  });
  UpdateConfig.setConfig("stopOnError", config.stopOnError as StopOnError, {
    nosave: true,
    tribeOverride: true,
  });
  if (config.minWpm !== "off") {
    UpdateConfig.setConfig("minWpmCustomSpeed", config.minWpm, setOptions);
    UpdateConfig.setConfig("minWpm", "custom", setOptions);
  } else {
    UpdateConfig.setConfig("minWpm", "off", setOptions);
  }
  if (config.minAcc !== "off") {
    UpdateConfig.setConfig("minAccCustom", config.minAcc, setOptions);
    UpdateConfig.setConfig("minAcc", "custom", setOptions);
  } else {
    UpdateConfig.setConfig("minAcc", "off", setOptions);
  }
  if (config.minBurst !== "off") {
    UpdateConfig.setConfig("minBurstCustomSpeed", config.minBurst, setOptions);
    UpdateConfig.setConfig("minBurst", "fixed", setOptions);
  } else {
    UpdateConfig.setConfig("minBurst", "off", setOptions);
  }
}

export function setLoadingIndicator(bool: boolean): void {
  if (bool) {
    $(
      ".pageTribe .tribePage.lobby .currentConfig .loadingIndicator",
    ).removeClass("hidden");
  } else {
    $(".pageTribe .tribePage.lobby .currentConfig .loadingIndicator").addClass(
      "hidden",
    );
  }
}

let syncConfigTimeout: NodeJS.Timeout | null = null;

function sync(): void {
  if (TribeState.getState() <= 1) return;
  if (!TribeState.getSelf()?.isLeader) return;
  setLoadingIndicator(true);
  TribeButtons.disableStartButton();
  if (syncConfigTimeout !== null) return;

  syncConfigTimeout = setTimeout(() => {
    // setLoadingIndicator(false);
    let mode2;
    if (Config.mode === "time") {
      mode2 = Config.time;
    } else if (Config.mode === "words") {
      mode2 = Config.words;
    } else if (Config.mode === "quote") {
      mode2 = Config.quoteLength ?? -1;
    } else if (Config.mode === "custom") {
      mode2 = "custom";
    } else {
      mode2 = "zen";
    }

    tribeSocket.out.room.updateConfig({
      mode: Config.mode,
      mode2: mode2,
      difficulty: Config.difficulty,
      language: Config.language,
      punctuation: Config.punctuation,
      numbers: Config.numbers,
      funbox: Config.funbox,
      lazyMode: Config.lazyMode,
      stopOnError: Config.stopOnError,
      minWpm: Config.minWpm === "custom" ? Config.minWpmCustomSpeed : "off",
      minAcc: Config.minAcc === "custom" ? Config.minAccCustom : "off",
      minBurst:
        Config.minBurst === "fixed" ? Config.minBurstCustomSpeed : "off",
      //todo fix
      // customText: {
      // text: CustomText.text,
      // isWordRandom: CustomText.isWordRandom,
      // isTimeRandom: CustomText.isTimeRandom,
      // word: CustomText.word,
      // time: CustomText.time,
      // },
      isInfiniteTest:
        (Config.mode === "time" || Config.mode === "words") && mode2 === "0",
    });
    clearTimeout(syncConfigTimeout as NodeJS.Timeout);
    syncConfigTimeout = null;
  }, 500);
}

TribeConfigSyncEvent.subscribe(() => {
  sync();
});
