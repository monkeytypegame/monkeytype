import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../states/notifications";
import * as CustomText from "../test/custom-text";
import * as Funbox from "../test/funbox/funbox";

import { setConfig } from "../config/setters";
import { Config } from "../config/store";
import { configEvent } from "../events/config";
import * as TestState from "../test/test-state";

import { ChallengeSettings, getChallenge } from "@monkeytype/challenges";
import { ChallengeName } from "@monkeytype/schemas/challenges";
import { CompletedEvent } from "@monkeytype/schemas/results";
import { typedKeys } from "@monkeytype/util/objects";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import { getLoadedChallenge, setLoadedChallenge } from "../states/test";
import { areUnsortedArraysEqual } from "../utils/arrays";
import { qs } from "../utils/dom";

let challengeLoading = false;

export function clearActive(): void {
  if (
    getLoadedChallenge() !== null &&
    !challengeLoading &&
    !TestState.testRestarting
  ) {
    showNoticeNotification("Challenge cleared");
    setLoadedChallenge(null);
  }
}

function verifyRequirement(
  result: CompletedEvent,
  requirements: NonNullable<ChallengeSettings["requirements"]>,
  requirementType: keyof NonNullable<ChallengeSettings["requirements"]>,
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
    if ("min" in requirementValue) {
      if (Math.round(result.testDuration) < requirementValue.min) {
        requirementsMet = false;
        failReasons.push(`Test time below ${requirementValue.min}`);
      }
    } else if ("max" in requirementValue) {
      if (Math.round(result.testDuration) > requirementValue.max) {
        requirementsMet = false;
        failReasons.push(`Test time above ${requirementValue.max}`);
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
    for (const configKey of typedKeys(requirementValue)) {
      const configValue = requirementValue[configKey];
      if (Config[configKey] !== configValue) {
        requirementsMet = false;
        failReasons.push(`${configKey} not set to ${configValue}`);
      }
    }
  }
  return [requirementsMet, failReasons];
}

export function verify(result: CompletedEvent): ChallengeName | null {
  const loadedChallenge = getLoadedChallenge();

  if (loadedChallenge === null) return null;

  try {
    const afk = (result.afkDuration / result.testDuration) * 100;

    if (afk > 10) {
      showNoticeNotification(`Challenge failed: AFK time is greater than 10%`);
      return null;
    }

    if (loadedChallenge.settings?.requirements === undefined) {
      showSuccessNotification(`${loadedChallenge.display} challenge passed!`);
      return loadedChallenge.name || null;
    } else {
      let requirementsMet = true;
      const failReasons: string[] = [];
      for (const requirementType of typedKeys(
        loadedChallenge.settings.requirements,
      )) {
        const [passed, requirementFailReasons] = verifyRequirement(
          result,
          loadedChallenge.settings.requirements,
          requirementType,
        );
        if (!passed) {
          requirementsMet = false;
        }
        failReasons.push(...requirementFailReasons);
      }
      if (requirementsMet) {
        if (loadedChallenge.settings.autoRole) {
          showSuccessNotification(
            "You will receive a role shortly. Please don't post a screenshot in challenge submissions.",
            { durationMs: 5000 },
          );
        }
        showSuccessNotification(`${loadedChallenge.display} challenge passed!`);
        return loadedChallenge.name;
      } else {
        showNoticeNotification(
          `${
            loadedChallenge.display
          } challenge failed: ${failReasons.join(", ")}`,
        );
        return null;
      }
    }
  } catch (e) {
    console.error(e);
    showNoticeNotification(
      `Something went wrong when verifying challenge: ${(e as Error).message}`,
    );
    return null;
  }
}

export async function setup(challengeName: ChallengeName): Promise<boolean> {
  challengeLoading = true;

  setConfig("funbox", []);

  const challenge = getChallenge(challengeName);
  const settings = challenge.settings;

  let notitext;
  try {
    if (challenge === undefined || settings === undefined) {
      showNoticeNotification("Challenge not found or missing settings");
      setTimeout(() => {
        qs("header .config")?.show();
        qs(".page.pageTest")?.show();
      }, 250);
      return false;
    }
    if (settings.type === "customTime") {
      setConfig("time", settings.parameters.time, {
        nosave: true,
      });
      setConfig("mode", "time", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
      if (challengeName === "englishMaster") {
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
    } else if (settings.type === "customWords") {
      setConfig("words", settings.parameters.words, {
        nosave: true,
      });
      setConfig("mode", "words", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
    } else if (settings.type === "customText") {
      CustomText.setText(
        settings.parameters.text.split(
          settings.parameters.isPipeDelimiter ? "|" : " ",
        ),
      );
      CustomText.setMode(settings.parameters.mode);
      CustomText.setLimitValue(settings.parameters.limit);
      CustomText.setLimitMode(settings.parameters.limitMode);
      CustomText.setPipeDelimiter(settings.parameters.isPipeDelimiter);
      setConfig("mode", "custom", {
        nosave: true,
      });
      setConfig("difficulty", "normal", {
        nosave: true,
      });
    } else if (settings.type === "script") {
      showLoaderBar();
      const response = await fetch(`/challenges/${settings.parameters.script}`);
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
      if (settings.parameters.theme !== undefined) {
        setConfig("theme", settings.parameters.theme);
      }
      if (settings.parameters.funboxes !== undefined) {
        void Funbox.activate(settings.parameters.funboxes);
      }
    } else if (settings.type === "accuracy") {
      setConfig("time", 0, {
        nosave: true,
      });
      setConfig("mode", "time", {
        nosave: true,
      });
      setConfig("difficulty", "master", {
        nosave: true,
      });
    } else if (settings.type === "funbox") {
      setConfig("difficulty", "normal", {
        nosave: true,
      });
      if (settings.parameters.mode === "words") {
        setConfig("words", settings.parameters.mode2, {
          nosave: true,
        });
      } else if (settings.parameters.mode === "time") {
        setConfig("time", settings.parameters.mode2, {
          nosave: true,
        });
      }
      setConfig("mode", settings.parameters.mode, {
        nosave: true,
      });
      if (settings.parameters.difficulty !== undefined) {
        setConfig("difficulty", settings.parameters.difficulty, {
          nosave: true,
        });
      }

      if (
        !setConfig("funbox", [settings.parameters.funbox], {
          nosave: true,
        })
      ) {
        throw new Error("Can't load challenge with current config");
      }
    } else if (settings.type === "other") {
      if (challengeName === "wingdings") {
        // Ten Words of Pain: 10-word Master mode test using the Wingdings custom font, no keymap
        setConfig("mode", "words", {
          nosave: true,
        });
        setConfig("words", 10, {
          nosave: true,
        });
        setConfig("difficulty", "master", {
          nosave: true,
        });
        setConfig("fontFamily", "Wingdings", {
          nosave: true,
        });
        setConfig("keymapMode", "off", {
          nosave: true,
        });
      }
    }
    notitext = settings.message;
    qs("header .config")?.show();
    qs(".page.pageTest")?.show();

    if (notitext === undefined) {
      showSuccessNotification(`Challenge '${challenge.display}' loaded.`);
    } else {
      showSuccessNotification(`Challenge loaded. ${notitext}`);
    }
    setLoadedChallenge(challenge);
    return true;
  } catch (e) {
    showErrorNotification("Failed to load challenge", { error: e });
    return false;
  } finally {
    challengeLoading = false;
  }
}

configEvent.subscribe(({ key }) => {
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
      "fontFamily",
    ].includes(key)
  ) {
    clearActive();
  }
});
