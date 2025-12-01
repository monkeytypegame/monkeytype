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
        quoteLengthString.length - 1
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
  UpdateConfig.setMode(config.mode as Mode, true);
  if (config.mode === "time") {
    UpdateConfig.setTimeConfig(config.mode2 as number, true, true);
  } else if (config.mode === "words") {
    UpdateConfig.setWordCount(config.mode2 as number, true, true);
  } else if (config.mode === "quote") {
    UpdateConfig.setQuoteLength(config.mode2 as QuoteLengthConfig, true, true);
  } else if (config.mode === "custom") {
    //todo fix
    // CustomText.setText(config.customText.text, true);
    // CustomText.setIsWordRandom(config.customText.isWordRandom, true);
    // CustomText.setIsTimeRandom(config.customText.isTimeRandom, true);
    // CustomText.setTime(config.customText.time, true);
    // CustomText.setWord(config.customText.word, true);
  }
  UpdateConfig.setDifficulty(config.difficulty as Difficulty, true, true);
  UpdateConfig.setLanguage(config.language as Language, true, true);
  UpdateConfig.setPunctuation(config.punctuation, true);
  UpdateConfig.setNumbers(config.numbers, true);
  Funbox.setFunbox(config.funbox as FunboxName[], true);
  UpdateConfig.setLazyMode(config.lazyMode, true, true);
  UpdateConfig.setStopOnError(config.stopOnError as StopOnError, true, true);
  if (config.minWpm !== "off") {
    UpdateConfig.setMinWpmCustomSpeed(config.minWpm, true, true);
    UpdateConfig.setMinWpm("custom", true, true);
  } else {
    UpdateConfig.setMinWpm("off", true, true);
  }
  if (config.minAcc !== "off") {
    UpdateConfig.setMinAccCustom(config.minAcc, true, true);
    UpdateConfig.setMinAcc("custom", true, true);
  } else {
    UpdateConfig.setMinAcc("off", true, true);
  }
  if (config.minBurst !== "off") {
    UpdateConfig.setMinBurstCustomSpeed(config.minBurst, true, true);
    UpdateConfig.setMinBurst("fixed", true, true);
  } else {
    UpdateConfig.setMinBurst("off", true, true);
  }
}

export function setLoadingIndicator(bool: boolean): void {
  if (bool) {
    $(
      ".pageTribe .tribePage.lobby .currentConfig .loadingIndicator"
    ).removeClass("hidden");
  } else {
    $(".pageTribe .tribePage.lobby .currentConfig .loadingIndicator").addClass(
      "hidden"
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
      mode2 = Config.quoteLength === undefined ? -1 : Config.quoteLength;
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
