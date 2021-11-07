import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as ManualRestart from "./manual-restart-tracker";
import * as CustomText from "./custom-text";
import * as TestLogic from "./test-logic";
import * as Funbox from "./funbox";
import Config, * as UpdateConfig from "./config";
import * as UI from "./ui";
import * as TestUI from "./test-ui";

export let active = null;
let challengeLoading = false;

export function clearActive() {
  if (active && !challengeLoading && !TestUI.testRestarting) {
    Notifications.add("Challenge cleared", 0);
    active = null;
  }
}

export function verify(result) {
  try {
    if (active) {
      let afk = (result.afkDuration / result.testDuration) * 100;

      if (afk > 10) {
        Notifications.add(`Challenge failed: AFK time is greater than 10%`, 0);
        return null;
      }

      if (!active.requirements) {
        Notifications.add(`${active.display} challenge passed!`, 1);
        return active.name;
      } else {
        let requirementsMet = true;
        let failReasons = [];
        for (let requirementType in active.requirements) {
          if (requirementsMet == false) return;
          let requirementValue = active.requirements[requirementType];
          if (requirementType == "wpm") {
            let wpmMode = Object.keys(requirementValue)[0];
            if (wpmMode == "exact") {
              if (Math.round(result.wpm) != requirementValue.exact) {
                requirementsMet = false;
                failReasons.push(`WPM not ${requirementValue.exact}`);
              }
            } else if (wpmMode == "min") {
              if (result.wpm < requirementValue.min) {
                requirementsMet = false;
                failReasons.push(`WPM below ${requirementValue.min}`);
              }
            }
          } else if (requirementType == "acc") {
            let accMode = Object.keys(requirementValue)[0];
            if (accMode == "exact") {
              if (result.acc != requirementValue.exact) {
                requirementsMet = false;
                failReasons.push(`Accuracy not ${requirementValue.exact}`);
              }
            } else if (accMode == "min") {
              if (result.acc < requirementValue.min) {
                requirementsMet = false;
                failReasons.push(`Accuracy below ${requirementValue.min}`);
              }
            }
          } else if (requirementType == "afk") {
            let afkMode = Object.keys(requirementValue)[0];
            if (afkMode == "max") {
              if (Math.round(afk) > requirementValue.max) {
                requirementsMet = false;
                failReasons.push(
                  `AFK percentage above ${requirementValue.max}`
                );
              }
            }
          } else if (requirementType == "time") {
            let timeMode = Object.keys(requirementValue)[0];
            if (timeMode == "min") {
              if (Math.round(result.testDuration) < requirementValue.min) {
                requirementsMet = false;
                failReasons.push(`Test time below ${requirementValue.min}`);
              }
            }
          } else if (requirementType == "funbox") {
            let funboxMode = requirementValue;
            if (funboxMode != result.funbox) {
              requirementsMet = false;
              failReasons.push(`${funboxMode} funbox not active`);
            }
          } else if (requirementType == "raw") {
            let rawMode = Object.keys(requirementValue)[0];
            if (rawMode == "exact") {
              if (Math.round(result.rawWpm) != requirementValue.exact) {
                requirementsMet = false;
                failReasons.push(`Raw WPM not ${requirementValue.exact}`);
              }
            }
          } else if (requirementType == "con") {
            let conMode = Object.keys(requirementValue)[0];
            if (conMode == "exact") {
              if (Math.round(result.consistency) != requirementValue.exact) {
                requirementsMet = false;
                failReasons.push(`Consistency not ${requirementValue.exact}`);
              }
            }
          } else if (requirementType == "config") {
            for (let configKey in requirementValue) {
              let configValue = requirementValue[configKey];
              if (Config[configKey] != configValue) {
                requirementsMet = false;
                failReasons.push(`${configKey} not set to ${configValue}`);
              }
            }
          }
        }
        if (requirementsMet) {
          Notifications.add(`${active.display} challenge passed!`, 1);
          return active.name;
        } else {
          Notifications.add(
            `${active.display} challenge failed: ${failReasons.join(", ")}`,
            0
          );
          return null;
        }
      }
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    Notifications.add(
      `Something went wrong when verifying challenge: ${e.message}`,
      0
    );
    return null;
  }
}

export async function setup(challengeName) {
  challengeLoading = true;
  if (!$(".page.pageTest").hasClass("active")) {
    UI.changePage("", true);
  }

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
      UpdateConfig.setFunbox(challenge.parameters[0], true);
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
    challengeLoading = false;
  } catch (e) {
    Notifications.add("Something went wrong: " + e, -1);
  }
}
