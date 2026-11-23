import { describe, it, expect, beforeEach } from "vitest";
import { getChallenge } from "@monkeytype/challenges";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { Config, setConfigStore } from "../../src/ts/config/store";
import { __testing } from "../../src/ts/config/testing";
import "../../src/ts/controllers/challenge-controller";
import {
  getLoadedChallenge,
  setLoadedChallenge,
} from "../../src/ts/states/test";
import { setTestPhase } from "../../src/ts/test/engine/state";

const { replaceConfig } = __testing;

function set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
  Config[key] = value;
  setConfigStore(key, value);
}

describe("challenge controller config effects", () => {
  beforeEach(() => {
    replaceConfig({});
    setLoadedChallenge({ name: "oneHourWarrior" } as Parameters<
      typeof setLoadedChallenge
    >[0]);
  });

  it("clears the challenge on a test setting change", () => {
    set("mode", "words");
    expect(getLoadedChallenge()).toBeNull();
  });

  it("clears the challenge on a funbox change", () => {
    set("funbox", ["nausea"]);
    expect(getLoadedChallenge()).toBeNull();
  });

  it("keeps the challenge on other changes", () => {
    set("soundVolume", 0.3);
    expect(getLoadedChallenge()).not.toBeNull();
  });

  it("clears the challenge on a test setting change during a restart", () => {
    setTestPhase("restarting");
    set("mode", "words");
    setTestPhase("idle");
    expect(getLoadedChallenge()).toBeNull();
  });

  it("keeps the challenge on keys funboxes write", () => {
    set("layout", "dvorak");
    set("keymapLayout", "dvorak");
    set("showAllLines", true);
    set("keymapMode", "next");
    expect(getLoadedChallenge()).not.toBeNull();
  });

  it("keeps the challenge on a lazy mode change", () => {
    set("lazyMode", true);
    expect(getLoadedChallenge()).not.toBeNull();
  });

  it("keeps the challenge on keys only other challenges watch", () => {
    set("paceCaret", "average");
    set("fontFamily", "Wingdings");
    expect(getLoadedChallenge()).not.toBeNull();
  });
});

describe("challenge controller clearOnConfigChange", () => {
  beforeEach(() => {
    replaceConfig({});
  });

  it("clears the challenge on a key it watches", () => {
    setLoadedChallenge(getChallenge("wingdings"));
    set("fontFamily", "Fira_Code");
    expect(getLoadedChallenge()).toBeNull();
  });

  it("clears a speed challenge on a pace caret change", () => {
    setLoadedChallenge(getChallenge("69"));
    set("paceCaret", "average");
    expect(getLoadedChallenge()).toBeNull();
  });

  it("stops watching once another challenge loads", () => {
    setLoadedChallenge(getChallenge("wingdings"));
    setLoadedChallenge(getChallenge("oneHourWarrior"));
    set("fontFamily", "Fira_Code");
    expect(getLoadedChallenge()?.name).toBe("oneHourWarrior");
  });
});
