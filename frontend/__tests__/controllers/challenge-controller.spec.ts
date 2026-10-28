import { describe, it, expect, beforeEach } from "vitest";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { Config, setConfigStore } from "../../src/ts/config/store";
import { __testing } from "../../src/ts/config/testing";
import "../../src/ts/controllers/challenge-controller";
import {
  getLoadedChallenge,
  setLoadedChallenge,
} from "../../src/ts/states/test";

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
});
