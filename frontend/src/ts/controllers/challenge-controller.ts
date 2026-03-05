import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Notifications from "../elements/notifications";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import * as Funbox from "../test/funbox/funbox";
import Config, { setConfig } from "../config";
import * as ConfigEvent from "../observables/config-event";
import * as TestState from "../test/test-state";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import { CustomTextLimitMode, CustomTextMode } from "@monkeytype/schemas/util";
import {
  Config as ConfigType,
  Difficulty,
  ThemeName,
  FunboxName,
} from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { CompletedEvent } from "@monkeytype/schemas/results";
import { areUnsortedArraysEqual } from "../utils/arrays";
import { tryCatch } from "@monkeytype/util/trycatch";
import { Challenge } from "@monkeytype/schemas/challenges";
import { qs } from "../utils/dom";

let challengeLoading = false;

export function clearActive(): void {
  if (
    TestState.activeChallenge &&
    !challengeLoading &&
    !TestState.testRestarting
  ) {
    Notifications.add("Challenge cleared", 0);
    TestState.setActiveChallenge(null);
  }
}

function verifyRequirement(
  result: CompletedEvent,
  requirements: NonNullable<Challenge["requirements"]>,
  requirementType: keyof NonNullable<Challenge["requirements"]>,
): [boolean, string[]] {
  let requirementsMet = true;
  let failReasons: string[] = [];

  const afk = (result.afkDuration / result.testDuration) * 100;

  if (requirements[requirementType] === undefined) {
    throw new Error("Requirement value is undefined");
  }

  if (requirementType === "wpm" && requirements.wpm) {
    const requirementValue = requirements.wpm;
    if ("exact" in requirementValue) {
      if (Math.round(result.wpm) !== requirementValue.exact) {
        requirementsMet = false;
        failReasons.push(`WPM not ${requirementValue.exact}`);
      }
    } else if ("min" in requirementValue) {
      if (result.wpm < requirementValue.min) {
        requirementsMet = false;
        failReasons.push(`WPM below ${requirementValue.min}`);
      }
    }
  } else if (requirementType === "acc" && requirements.acc) {
    const requirementValue = requirements.acc;
    if ("exact" in requirementValue) {
      if (result.acc !== requirementValue.exact) {
        requirementsMet = false;
        failReasons.push(`Accuracy not ${requirementValue.exact}`);
      }
    } else if ("min" in requirementValue) {
      if (result.acc < requirementValue.min) {
        requirementsMet = false;
        failReasons.push(`Accuracy below ${requirementValue.min}`);
      }
    }
  } else if (requirementType === "afk" && requirements.afk) {
    const requirementValue = requirements.afk;
    if (requirementValue.max) {
      if (Math.round(afk) > requirementValue.max) {
        requirementsMet = false;
        failReasons.push(`AFK percentage above ${requirementValue.max}`);
      }
    }
  } else if (requirementType === "time" && requirements.time) {
    const requirementValue = requirements.time;
    if (requirementValue.min) {
      if (Math.round(result.testDuration) < requirementValue.min) {
        requirementsMet = false;
        failReasons.push(`Test time below ${requirementValue.min}`);
      }
    }
  } else if (requirementType === "funbox" && requirements.funbox) {
    const funboxMode = requirements.funbox.exact;
    if (funboxMode === undefined) {
      throw new Error("Funbox mode is undefined");
    }

    if (!areUnsortedArraysEqual(funboxMode, result.funbox)) {
      requirementsMet = false;
      for (const f of funboxMode) {
        if (!result.funbox?.includes(f)) {
          failReasons.push(`${f} funbox not active`);
        }
      }
      if (result.funbox !== undefined && result.funbox.length > 0) {
        for (const f of result.funbox) {
          if (!funboxMode.includes(f)) {
            failReasons.push(`${f} funbox active`);
          }
        }
      }
    }
  } else if (requirementType === "raw" && requirements.raw) {
    const requirementValue = requirements.raw;
    if (requirementValue.exact) {
      if (Math.round(result.rawWpm) !== requirementValue.exact) {
        requirementsMet = false;
        failReasons.push(`Raw WPM not ${requirementValue.exact}`);
      }
    }
  } else if (requirementType === "con" && requirements.con) {
    const requirementValue = requirements.con;
    if (requirementValue.exact) {
      if (Math.round(result.consistency) !== requirementValue.exact) {
        requirementsMet = false;
        failReasons.push(`Consistency not ${requirementValue.exact}`);
      }
    }
  } else if (requirementType === "config" && requirements.config) {
    const requirementValue = requirements.config;
    for (const configKey of Misc.typedKeys(requirementValue)) {
      const configValue = requirementValue[configKey];
      if (Config[configKey as keyof ConfigType] !== configValue) {
        requirementsMet = false;
        failReasons.push(`${configKey} not set to ${configValue}`);
      }
    }
  }
  return [requirementsMet, failReasons];
}

export function verify(result: CompletedEvent): string | null {
  if (!TestState.activeChallenge) return null;

  try {
    const afk = (result.afkDuration / result.testDuration) * 100;

    if (afk > 10) {
      Notifications.add(`Challenge failed: AFK time is greater than 10%`, 0);
      return null;
    }

    if (TestState.activeChallenge.requirements === undefined) {
      Notifications.add(
        `${TestState.activeChallenge.display} challenge passed!`,
        1,
      );
      return TestState.activeChallenge.name;
    } else {
      let requirementsMet = true;
      const failReasons: string[] = [];
      for (const requirementType of Misc.typedKeys(
        TestState.activeChallenge.requirements,
      )) {
        const [passed, requirementFailReasons] = verifyRequirement(
          result,
          TestState.activeChallenge.requirements,
          requirementType,
        );
        if (!passed) {
          requirementsMet = false;
        }
        failReasons.push(...requirementFailReasons);
      }
      if (requirementsMet) {
        if (TestState.activeChallenge.autoRole) {
          Notifications.add(
            "You will receive a role shortly. Please don't post a screenshot in challenge submissions.",
            1,
            {
              duration: 5,
            },
          );
        }
        Notifications.add(
          `${TestState.activeChallenge.display} challenge passed!`,
          1,
        );
        return TestState.activeChallenge.name;
      } else {
        Notifications.add(
          `${
            TestState.activeChallenge.display
          } challenge failed: ${failReasons.join(", ")}`,
          0,
        );
        return null;
      }
    }
  } catch (e) {
    console.error(e);
    Notifications.add(
      `Something went wrong when verifying challenge: ${(e as Error).message}`,
      0,
    );
    return null;
  }
}

export async function setup(challengeName: string): Promise<boolean> {
  challengeLoading = true;

  setConfig("funbox", []);

  const { data: list, error } = await tryCatch(JSONData.getChallengeList());
  if (error) {
    const message = Misc.createErrorMessage(error, "Failed to setup challenge");
    Notifications.add(message, -1);
    ManualRestart.set();
    setTimeout(() => {
      qs("header .config")?.show();
      qs(".page.pageTest")?.show();
    }, 250);
    return false;
  }

  const challenge = list.find(
    (c) => c.name.toLowerCase() === challengeName.toLowerCase(),
  );
  let notitext;
  try {
    if (challenge === undefined) {
      Notifications.add("Challenge not found", 0);
      ManualRestart.set();
      setTimeout(() => {
        qs("header .config")?.show();
        qs(".page.pageTest")?.show();
      }, 250);
      return false;
    }
    if (challenge.type === "customTime") {
      setConfig("time", challenge.parameters[0] as number, {
        nosave: true,
      });
      setConfig("mode", "time", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
      if (challenge.name === "englishMaster") {
        setConfig("language", "english_10k", {
          nosave: true,
        });
        setConfig("numbers", true, {
          nosave: true,
        });
        setConfig("punctuation", true, {
          nosave: true,
        });
      }
    } else if (challenge.type === "customWords") {
      setConfig("words", challenge.parameters[0] as number, {
        nosave: true,
      });
      setConfig("mode", "words", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
    } else if (challenge.type === "customText") {
      CustomText.setText((challenge.parameters[0] as string).split(" "));
      CustomText.setMode(challenge.parameters[1] as CustomTextMode);
      CustomText.setLimitValue(challenge.parameters[2] as number);
      CustomText.setLimitMode(challenge.parameters[3] as CustomTextLimitMode);
      CustomText.setPipeDelimiter(challenge.parameters[4] as boolean);
      setConfig("mode", "custom", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
    } else if (challenge.type === "script") {
      showLoaderBar();
      const response = await fetch(
        "/challenges/" + (challenge.parameters[0] as string),
      );
      hideLoaderBar();
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
      setConfig("mode", "custom", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
      if (challenge.parameters[1] !== null) {
        setConfig("theme", challenge.parameters[1] as ThemeName);
      }
      if (challenge.parameters[2] !== null) {
        void Funbox.activate(challenge.parameters[2] as FunboxName[]);
      }
    } else if (challenge.type === "accuracy") {
      setConfig("time", 0, {
        nosave: true,
      });
      setConfig("mode", "time", {
        nosave: true,
      });
      setConfig("difficulty", "master", {
        nosave: true,
      });
    } else if (challenge.type === "funbox") {
      setConfig("funbox", challenge.parameters[0] as FunboxName[], {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
      if (challenge.parameters[1] === "words") {
        setConfig("words", challenge.parameters[2] as number, {
          nosave: true,
        });
      } else if (challenge.parameters[1] === "time") {
        setConfig("time", challenge.parameters[2] as number, {
          nosave: true,
        });
      }
      setConfig("mode", challenge.parameters[1] as Mode, {
        nosave: true,
      });
      if (challenge.parameters[3] !== undefined) {
        setConfig("difficulty", challenge.parameters[3] as Difficulty, {
          nosave: true,
        });
      }
    } else if (challenge.type === "special") {
      if (challenge.name === "semimak") {
        // so can you make a link that sets up 120s, 10k, punct, stop on word, and semimak as the layout?
        setConfig("mode", "time", {
          nosave: true,
        });
        setConfig("time", 120, {
          nosave: true,
        });
        setConfig("language", "english_10k", {
          nosave: true,
        });
        setConfig("punctuation", true, {
          nosave: true,
        });
        setConfig("stopOnError", "word", {
          nosave: true,
        });
        setConfig("layout", "semimak", {
          nosave: true,
        });
        setConfig("keymapLayout", "overrideSync", {
          nosave: true,
        });
        setConfig("keymapMode", "static", {
          nosave: true,
        });
      }
    }
    ManualRestart.set();
    notitext = challenge.message;
    qs("header .config")?.show();
    qs(".page.pageTest")?.show();

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
      -1,
    );
    return false;
  }
}

ConfigEvent.subscribe(({ key }) => {
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
    ].includes(key)
  ) {
    clearActive();
  }
});
