import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Notifications from "../elements/notifications";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import * as Funbox from "../test/funbox/funbox";
import Config, * as UpdateConfig from "../config";
import * as TestUI from "../test/test-ui";
import * as ConfigEvent from "../observables/config-event";
import * as TestState from "../test/test-state";
import * as Loader from "../elements/loader";
import {
  CustomTextLimitMode,
  CustomTextMode,
} from "@monkeytype/contracts/schemas/util";
import {
  Config as ConfigType,
  Difficulty,
} from "@monkeytype/contracts/schemas/configs";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import { CompletedEvent } from "@monkeytype/contracts/schemas/results";

let challengeLoading = false;

export function clearActive(): void {
  if (
    TestState.activeChallenge &&
    !challengeLoading &&
    !TestUI.testRestarting
  ) {
    Notifications.add("Challenge cleared", 0);
    TestState.setActiveChallenge(null);
  }
}

export function verify(result: CompletedEvent): string | null {
  try {
    if (TestState.activeChallenge) {
      const afk = (result.afkDuration / result.testDuration) * 100;

      if (afk > 10) {
        Notifications.add(`Challenge failed: AFK time is greater than 10%`, 0);
        return null;
      }

      if (TestState.activeChallenge.requirements === undefined) {
        Notifications.add(
          `${TestState.activeChallenge.display} challenge passed!`,
          1
        );
        return TestState.activeChallenge.name;
      } else {
        let requirementsMet = true;
        const failReasons = [];
        for (const requirementType in TestState.activeChallenge.requirements) {
          if (!requirementsMet) return null;
          const requirementValue =
            TestState.activeChallenge.requirements[requirementType];

          if (requirementValue === undefined) {
            throw new Error("Requirement value is undefined");
          }

          if (requirementType === "wpm") {
            const wpmMode = Object.keys(requirementValue)[0];
            if (wpmMode === "exact") {
              if (Math.round(result.wpm) !== requirementValue["exact"]) {
                requirementsMet = false;
                failReasons.push(`WPM not ${requirementValue["exact"]}`);
              }
            } else if (wpmMode === "min") {
              if (result.wpm < Number(requirementValue["min"])) {
                requirementsMet = false;
                failReasons.push(`WPM below ${requirementValue["min"]}`);
              }
            }
          } else if (requirementType === "acc") {
            const accMode = Object.keys(requirementValue)[0];
            if (accMode === "exact") {
              if (result.acc !== requirementValue["exact"]) {
                requirementsMet = false;
                failReasons.push(`Accuracy not ${requirementValue["exact"]}`);
              }
            } else if (accMode === "min") {
              if (result.acc < Number(requirementValue["min"])) {
                requirementsMet = false;
                failReasons.push(`Accuracy below ${requirementValue["min"]}`);
              }
            }
          } else if (requirementType === "afk") {
            const afkMode = Object.keys(requirementValue)[0];
            if (afkMode === "max") {
              if (Math.round(afk) > Number(requirementValue["max"])) {
                requirementsMet = false;
                failReasons.push(
                  `AFK percentage above ${requirementValue["max"]}`
                );
              }
            }
          } else if (requirementType === "time") {
            const timeMode = Object.keys(requirementValue)[0];
            if (timeMode === "min") {
              if (
                Math.round(result.testDuration) <
                Number(requirementValue["min"])
              ) {
                requirementsMet = false;
                failReasons.push(`Test time below ${requirementValue["min"]}`);
              }
            }
          } else if (requirementType === "funbox") {
            const funboxMode = requirementValue["exact"]
              ?.toString()
              .split("#")
              .sort()
              .join("#");

            if (funboxMode === undefined) {
              throw new Error("Funbox mode is undefined");
            }

            if (funboxMode !== result.funbox) {
              requirementsMet = false;
              for (const f of funboxMode.split("#")) {
                if (
                  result.funbox?.split("#").find((rf: string) => rf === f) ===
                  undefined
                ) {
                  failReasons.push(`${f} funbox not active`);
                }
              }
              const funboxSplit = result.funbox?.split("#");
              if (funboxSplit !== undefined && funboxSplit.length > 0) {
                for (const f of funboxSplit) {
                  if (
                    funboxMode.split("#").find((rf) => rf === f) === undefined
                  ) {
                    failReasons.push(`${f} funbox active`);
                  }
                }
              }
            }
          } else if (requirementType === "raw") {
            const rawMode = Object.keys(requirementValue)[0];
            if (rawMode === "exact") {
              if (Math.round(result.rawWpm) !== requirementValue["exact"]) {
                requirementsMet = false;
                failReasons.push(`Raw WPM not ${requirementValue["exact"]}`);
              }
            }
          } else if (requirementType === "con") {
            const conMode = Object.keys(requirementValue)[0];
            if (conMode === "exact") {
              if (
                Math.round(result.consistency) !== requirementValue["exact"]
              ) {
                requirementsMet = false;
                failReasons.push(
                  `Consistency not ${requirementValue["exact"]}`
                );
              }
            }
          } else if (requirementType === "config") {
            for (const configKey in requirementValue) {
              const configValue = requirementValue[configKey];
              if (Config[configKey as keyof ConfigType] !== configValue) {
                requirementsMet = false;
                failReasons.push(`${configKey} not set to ${configValue}`);
              }
            }
          }
        }
        if (requirementsMet) {
          if (TestState.activeChallenge.autoRole) {
            Notifications.add(
              "You will receive a role shortly. Please don't post a screenshot in challenge submissions.",
              1,
              {
                duration: 5,
              }
            );
          }
          Notifications.add(
            `${TestState.activeChallenge.display} challenge passed!`,
            1
          );
          return TestState.activeChallenge.name;
        } else {
          Notifications.add(
            `${
              TestState.activeChallenge.display
            } challenge failed: ${failReasons.join(", ")}`,
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
      `Something went wrong when verifying challenge: ${(e as Error).message}`,
      0
    );
    return null;
  }
}

export async function setup(challengeName: string): Promise<boolean> {
  challengeLoading = true;

  UpdateConfig.setFunbox("none");

  let list;
  try {
    list = await JSONData.getChallengeList();
  } catch (e) {
    const message = Misc.createErrorMessage(e, "Failed to setup challenge");
    Notifications.add(message, -1);
    ManualRestart.set();
    setTimeout(() => {
      $("header .config").removeClass("hidden");
      $(".page.pageTest").removeClass("hidden");
    }, 250);
    return false;
  }

  const challenge = list.filter(
    (c) => c.name.toLowerCase() === challengeName.toLowerCase()
  )[0];
  let notitext;
  try {
    if (challenge === undefined) {
      Notifications.add("Challenge not found", 0);
      ManualRestart.set();
      setTimeout(() => {
        $("header .config").removeClass("hidden");
        $(".page.pageTest").removeClass("hidden");
      }, 250);
      return false;
    }
    if (challenge.type === "customTime") {
      UpdateConfig.setTimeConfig(challenge.parameters[0] as number, true);
      UpdateConfig.setMode("time", true);
      UpdateConfig.setDifficulty("normal", true);
      if (challenge.name === "englishMaster") {
        UpdateConfig.setLanguage("english_10k", true);
        UpdateConfig.setNumbers(true, true);
        UpdateConfig.setPunctuation(true, true);
      }
    } else if (challenge.type === "customWords") {
      UpdateConfig.setWordCount(challenge.parameters[0] as number, true);
      UpdateConfig.setMode("words", true);
      UpdateConfig.setDifficulty("normal", true);
    } else if (challenge.type === "customText") {
      CustomText.setText((challenge.parameters[0] as string).split(" "));
      CustomText.setMode(challenge.parameters[1] as CustomTextMode);
      CustomText.setLimitValue(challenge.parameters[2] as number);
      CustomText.setLimitMode(challenge.parameters[3] as CustomTextLimitMode);
      CustomText.setPipeDelimiter(challenge.parameters[4] as boolean);
      UpdateConfig.setMode("custom", true);
      UpdateConfig.setDifficulty("normal", true);
    } else if (challenge.type === "script") {
      Loader.show();
      const response = await fetch("/challenges/" + challenge.parameters[0]);
      Loader.hide();
      if (response.status !== 200) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const scriptdata = await response.text();
      let text = scriptdata.trim();
      text = text.replace(/[\n\r\t ]/gm, " ");
      text = text.replace(/ +/gm, " ");
      CustomText.setText(text.split(" "));
      CustomText.setMode("repeat");
      CustomText.setLimitMode("word");
      CustomText.setPipeDelimiter(false);
      UpdateConfig.setMode("custom", true);
      UpdateConfig.setDifficulty("normal", true);
      if (challenge.parameters[1] !== null) {
        UpdateConfig.setTheme(challenge.parameters[1] as string);
      }
      if (challenge.parameters[2] !== null) {
        void Funbox.activate(challenge.parameters[2] as string);
      }
    } else if (challenge.type === "accuracy") {
      UpdateConfig.setTimeConfig(0, true);
      UpdateConfig.setMode("time", true);
      UpdateConfig.setDifficulty("master", true);
    } else if (challenge.type === "funbox") {
      UpdateConfig.setFunbox(challenge.parameters[0] as string, true);
      UpdateConfig.setDifficulty("normal", true);
      if (challenge.parameters[1] === "words") {
        UpdateConfig.setWordCount(challenge.parameters[2] as number, true);
      } else if (challenge.parameters[1] === "time") {
        UpdateConfig.setTimeConfig(challenge.parameters[2] as number, true);
      }
      UpdateConfig.setMode(challenge.parameters[1] as Mode, true);
      if (challenge.parameters[3] !== undefined) {
        UpdateConfig.setDifficulty(challenge.parameters[3] as Difficulty, true);
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
    notitext = challenge.message;
    $("header .config").removeClass("hidden");
    $(".page.pageTest").removeClass("hidden");

    if (notitext === undefined) {
      Notifications.add(`Challenge '${challenge.display}' loaded.`, 0);
    } else {
      Notifications.add("Challenge loaded. " + notitext, 0);
    }
    TestState.setActiveChallenge(challenge);
    challengeLoading = false;
    return true;
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to load challenge"),
      -1
    );
    return false;
  }
}

ConfigEvent.subscribe((eventKey) => {
  if (
    [
      "difficulty",
      "numbers",
      "punctuation",
      "mode",
      "funbox",
      "paceCaret",
      "showAllLines",
      "showLiveWpm",
      "highlightMode",
      "time",
      "words",
      "keymapMode",
      "keymapLayout",
      "layout",
    ].includes(eventKey)
  ) {
    clearActive();
  }
});
