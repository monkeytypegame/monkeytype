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

import { getChallenge } from "@monkeytype/challenges";
import { verify as verifyChallenge } from "@monkeytype/challenges/verify";
import { ChallengeName } from "@monkeytype/schemas/challenges";
import { ConfigValue } from "@monkeytype/schemas/configs";
import { CompletedEvent } from "@monkeytype/schemas/results";
import { typedKeys } from "@monkeytype/util/objects";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import { getLoadedChallenge, setLoadedChallenge } from "../states/test";
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

export function verify(result: CompletedEvent): ChallengeName | null {
  if (result.challenge === undefined) return null;
  const verification = verifyChallenge(result);

  if (verification.state === "error") {
    showNoticeNotification(
      `${verification.errorMessage}: ${(verification.error as Error)?.message}`,
    );
    return null;
  } else if (verification.state === "failed") {
    showNoticeNotification(verification.reason);
    return null;
  }

  //Config is not verified by the verifyChallenge
  if (verification.challenge.settings?.requirements?.config !== undefined) {
    const requirementValue =
      verification.challenge.settings.requirements.config;
    const failReasons: string[] = [];
    for (const configKey of typedKeys(requirementValue)) {
      const configValue = requirementValue[configKey];
      if (Config[configKey] !== configValue) {
        failReasons.push(`${configKey} not set to ${configValue}`);
      }
    }
    if (failReasons.length !== 0) {
      showNoticeNotification(
        `${result.challenge} challenge failed: ${failReasons.join(", ")}`,
      );
      return null;
    }
  }

  if (verification.challenge.settings?.autoRole) {
    showSuccessNotification(
      "You will receive a role shortly. Please don't post a screenshot in challenge submissions.",
      { durationMs: 5000 },
    );
  }
  showSuccessNotification(
    `${verification.challenge.display} challenge passed!`,
  );
  return verification.challenge.name;
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
    if ("parameters" in settings && "config" in settings.parameters) {
      const config =
        (settings.parameters.config === "fromRequirements"
          ? settings.requirements?.config
          : settings.parameters.config) ?? {};

      for (const configKey of typedKeys(config)) {
        const configValue = config[configKey] as ConfigValue;
        setConfig(configKey, configValue, { nosave: true });
      }
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
        const funboxes =
          settings.parameters.funboxes === "fromRequirements"
            ? (settings.requirements?.funbox?.exact ?? [])
            : settings.parameters.funboxes;
        void Funbox.activate(funboxes);
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

      const funboxes =
        settings.parameters.funboxes === "fromRequirements"
          ? (settings.requirements?.funbox?.exact ?? [])
          : settings.parameters.funboxes;
      void Funbox.activate(funboxes);
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
