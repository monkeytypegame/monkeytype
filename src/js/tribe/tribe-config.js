import Config, * as UpdateConfig from "./config";
import * as Funbox from "./funbox";
import * as Notifications from "./notifications";
import * as CustomText from "./custom-text";
import * as TribePageLobby from "./tribe-page-lobby";
import * as Tribe from "./tribe";

export function apply(config) {
  Notifications.add("applying room config", 0);
  UpdateConfig.setMode(config.mode, true, true);
  if (config.mode === "time") {
    UpdateConfig.setTimeConfig(config.mode2, true, true);
  } else if (config.mode === "words") {
    UpdateConfig.setWordCount(config.mode2, true, true);
  } else if (config.mode === "quote") {
    UpdateConfig.setQuoteLength(config.mode2, true, true, true);
  } else if (config.mode === "custom") {
    CustomText.setText(config.customText.text);
    CustomText.setIsWordRandom(config.customText.isWordRandom);
    CustomText.setIsTimeRandom(config.customText.isTimeRandom);
    CustomText.setTime(config.customText.time);
    CustomText.setWord(config.customText.word);
  }
  UpdateConfig.setDifficulty(config.difficulty, true, true);
  UpdateConfig.setLanguage(config.language, true, true);
  UpdateConfig.setPunctuation(config.punctuation, true, true);
  UpdateConfig.setNumbers(config.numbers, true, true);
  Funbox.setFunbox(config.funbox, null, true);
  UpdateConfig.setLazyMode(config.lazyMode, true, true);
  UpdateConfig.setStopOnError(config.stopOnError, true, true);
  if (config.minWpm !== "off") {
    UpdateConfig.setMinWpmCustomSpeed(config.minAcc, true, true);
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
    UpdateConfig.setMinBurst("custom", true, true);
  } else {
    UpdateConfig.setMinBurst("off", true, true);
  }
}

export function setLoadingIndicator(truefalse) {
  if (truefalse) {
    $(
      ".pageTribe .tribePage.lobby .currentConfig .loadingIndicator"
    ).removeClass("hidden");
  } else {
    $(".pageTribe .tribePage.lobby .currentConfig .loadingIndicator").addClass(
      "hidden"
    );
  }
}

export function canChange(override) {
  if (Tribe.state <= 1) return true;
  if (Tribe.state !== 5) return false;
  if (Tribe.room.users[Tribe.socket.id].isLeader) {
    //is leader, allow
    return true;
  } else {
    //not leader, check if its being forced by tribe
    if (override) {
      return true;
    } else {
      return false;
    }
  }
}

let syncConfigTimeout = null;

export function sync() {
  if (Tribe.state <= 1) return;
  if (!Tribe.room.users[Tribe.socket.id].isLeader) return;
  setLoadingIndicator(true);
  TribePageLobby.disableStartButton();
  if (syncConfigTimeout === null) {
    syncConfigTimeout = setTimeout(() => {
      // setLoadingIndicator(false);
      let mode2;
      if (Config.mode === "time") {
        mode2 = Config.time;
      } else if (Config.mode === "words") {
        mode2 = Config.words;
      } else if (Config.mode === "quote") {
        mode2 = Config.quoteLength === undefined ? "-1" : Config.quoteLength;
      }
      Tribe.socket.emit("room_update_config", {
        config: {
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
          minAcc: Config.minAcc === "custom" ? Config.minAccCustom : null,
          minBurst:
            Config.minBurst === "custom" ? Config.minBurstCustomSpeed : "off",
          customText: {
            text: CustomText.text,
            isWordRandom: CustomText.isWordRandom,
            isTimeRandom: CustomText.isTimeRandom,
            word: CustomText.word,
            time: CustomText.time,
          },
        },
      });
      clearTimeout(syncConfigTimeout);
      syncConfigTimeout = null;
    }, 500);
  }
}
