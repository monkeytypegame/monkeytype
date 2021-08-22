import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as UpdateConfig from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as CustomText from "./custom-text";
import * as TestLogic from "./test-logic";
import * as Funbox from "./funbox";

export let active = null;

export function clearActive() {
  if (active) {
    Notifications.add("Challenge cleared", 0);
    active = null;
  }
}

export async function setup(challengeName) {
  let list = await Misc.getChallengeList();
  let challenge = list.filter((c) => c.name === challengeName)[0];
  let notitext;
  try {
    if (challenge === undefined) {
      Notifications.add("Challenge not found", 0);
      ManualRestart.set();
      TestLogic.restart(false, true);
      setTimeout(() => {
        $("#top .config").removeClass("hidden");
        $(".page.pageTest").removeClass("hidden");
      }, 250);
      return;
    }
    if (challenge.type === "customTime") {
      UpdateConfig.setTimeConfig(challenge.parameters[0], true);
      UpdateConfig.setMode("time", true);
      UpdateConfig.setDifficulty("normal", true);
      if (challenge.name === "englishMaster") {
        UpdateConfig.setLanguage("english_10k", true);
        UpdateConfig.setNumbers(true, true);
        UpdateConfig.setPunctuation(true, true);
      }
    } else if (challenge.type === "customWords") {
      UpdateConfig.setWordCount(challenge.parameters[0], true);
      UpdateConfig.setMode("words", true);
      UpdateConfig.setDifficulty("normal", true);
    } else if (challenge.type === "customText") {
      CustomText.setText(challenge.parameters[0].split(" "));
      CustomText.setIsWordRandom(challenge.parameters[1]);
      CustomText.setWord(parseInt(challenge.parameters[2]));
      UpdateConfig.setMode("custom", true);
      UpdateConfig.setDifficulty("normal", true);
    } else if (challenge.type === "script") {
      let scriptdata = await fetch("/challenges/" + challenge.parameters[0]);
      scriptdata = await scriptdata.text();
      let text = scriptdata.trim();
      text = text.replace(/[\n\r\t ]/gm, " ");
      text = text.replace(/ +/gm, " ");
      CustomText.setText(text.split(" "));
      CustomText.setIsWordRandom(false);
      UpdateConfig.setMode("custom", true);
      UpdateConfig.setDifficulty("normal", true);
      if (challenge.parameters[1] != null) {
        UpdateConfig.setTheme(challenge.parameters[1]);
      }
      if (challenge.parameters[2] != null) {
        Funbox.activate(challenge.parameters[2]);
      }
    } else if (challenge.type === "accuracy") {
      UpdateConfig.setTimeConfig(0, true);
      UpdateConfig.setMode("time", true);
      UpdateConfig.setDifficulty("master", true);
    } else if (challenge.type === "funbox") {
      Funbox.activate(challenge.parameters[0]);
      UpdateConfig.setDifficulty("normal", true);
      if (challenge.parameters[1] === "words") {
        UpdateConfig.setWordCount(challenge.parameters[2], true);
      } else if (challenge.parameters[1] === "time") {
        UpdateConfig.setTimeConfig(challenge.parameters[2], true);
      }
      UpdateConfig.setMode(challenge.parameters[1], true);
      if (challenge.parameters[3] !== undefined) {
        UpdateConfig.setDifficulty(challenge.parameters[3], true);
      }
    } else if (challenge.type === "special") {
      if (challenge.name === "semimak") {
        // so can you make a link that sets up 120s, 10k, punct, stop on word, and semimak as the layout?
        UpdateConfig.setMode("time", true);
        UpdateConfig.setTimeConfig(120, true);
        UpdateConfig.setLanguage("english_10k", true);
        UpdateConfig.setPunctuation(true, true);
        UpdateConfig.setStopOnError("word", true);
        UpdateConfig.setLayout("semimak", true);
        UpdateConfig.setKeymapLayout("overrideSync", true);
        UpdateConfig.setKeymapMode("static", true);
      }
    }
    ManualRestart.set();
    TestLogic.restart(false, true);
    notitext = challenge.message;
    $("#top .config").removeClass("hidden");
    $(".page.pageTest").removeClass("hidden");

    if (notitext === undefined) {
      Notifications.add(`Challenge '${challenge.display}' loaded.`, 0);
    } else {
      Notifications.add("Challenge loaded. " + notitext, 0);
    }
    active = challenge;
  } catch (e) {
    Notifications.add("Something went wrong: " + e, -1);
  }
}
