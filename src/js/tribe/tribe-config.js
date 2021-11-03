import * as UpdateConfig from "./config";
import * as Funbox from "./funbox";
import * as Notifications from "./notifications";
import * as CustomText from "./custom-text";

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
