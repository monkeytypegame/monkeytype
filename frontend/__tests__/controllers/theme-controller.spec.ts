import { describe, it, expect, beforeEach } from "vitest";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import * as ThemeController from "../../src/ts/controllers/theme-controller";
import { Config, setConfigStore } from "../../src/ts/config/store";
import { setConfig } from "../../src/ts/config/setters";
import { applyConfig } from "../../src/ts/config/lifecycle";
import { __testing } from "../../src/ts/config/testing";
import { getRandomTheme, getTheme } from "../../src/ts/states/theme";
import { getThemeIndicator, setThemeIndicator } from "../../src/ts/states/core";

const { replaceConfig } = __testing;

function set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
  Config[key] = value;
  setConfigStore(key, value);
}

describe("theme controller config effects", () => {
  beforeEach(() => {
    replaceConfig({ theme: "serika_dark" });
  });

  it("applies the theme", () => {
    set("theme", "8008");
    expect(getTheme().name).toBe("8008");
  });

  it("applies the custom theme and its colors", () => {
    set("customTheme", true);
    expect(getTheme().name).toBe("custom");

    const colors = [
      ...Config.customThemeColors,
    ] as ConfigType["customThemeColors"];
    colors[0] = "#123456";
    set("customThemeColors", colors);
    expect(getTheme().bg).toBe("#123456");
  });

  it("applies the light theme on auto switch", () => {
    set("themeLight", "nord_light");
    set("autoSwitchTheme", true);
    expect(getTheme().name).toBe("nord_light");

    set("autoSwitchTheme", false);
    expect(getTheme().name).toBe("serika_dark");
  });

  it("keeps the random theme over a custom theme", async () => {
    set("customTheme", true);
    set("randomTheme", "on");

    await ThemeController.randomizeTheme();
    await new Promise((resolve) => setTimeout(resolve));

    expect(getRandomTheme()).not.toBeNull();
    expect(getTheme().name).toBe(getRandomTheme()?.name);
    expect(Config.customTheme).toBe(false);
  });

  describe("while a random theme is active", () => {
    beforeEach(async () => {
      replaceConfig({ theme: "serika_dark", randomTheme: "on" });
      await ThemeController.randomizeTheme();
      expect(getRandomTheme()).not.toBeNull();
    });

    it("picks a new one each time", async () => {
      const before = getRandomTheme();
      await ThemeController.randomizeTheme();
      expect(getRandomTheme()).not.toBe(before);
      expect(getTheme().name).toBe(getRandomTheme()?.name);
    });

    it.each([
      ["re-picking the theme", () => setConfig("theme", "serika_dark")],
      ["re-picking preset", () => setConfig("customTheme", false)],
      ["turning random off", () => setConfig("randomTheme", "off")],
    ])("drops it on %s", (_, write) => {
      write();
      expect(getRandomTheme()).toBeNull();
      expect(getTheme().name).toBe("serika_dark");
    });

    it("drops it on a new theme", () => {
      setConfig("theme", "8008");
      expect(getRandomTheme()).toBeNull();
      expect(getTheme().name).toBe("8008");
    });

    it("drops it on picking custom", () => {
      setConfig("customTheme", true);
      expect(getRandomTheme()).toBeNull();
      expect(getTheme().name).toBe("custom");
    });

    it("drops it on a whole-config apply with the same theme", async () => {
      await applyConfig({ theme: "serika_dark", randomTheme: "on" });
      expect(getRandomTheme()).toBeNull();
      expect(getTheme().name).toBe("serika_dark");
    });

    it("keeps it when switching random mode", () => {
      const before = getRandomTheme();
      setConfig("randomTheme", "fav");
      expect(getRandomTheme()).toBe(before);
    });

    it("falls back to the auto switch theme when turned off", async () => {
      replaceConfig({
        theme: "serika_dark",
        randomTheme: "on",
        autoSwitchTheme: true,
        themeLight: "nord_light",
        themeDark: "nord_light",
      });
      await ThemeController.randomizeTheme();
      expect(getRandomTheme()).not.toBeNull();

      setConfig("randomTheme", "off");
      expect(getTheme().name).toBe("nord_light");
    });
  });

  it("updates the indicator on favorite changes", () => {
    setThemeIndicator({ text: "", isFavorite: false });
    set("favThemes", ["serika_dark"]);
    expect(getThemeIndicator()).toEqual({
      text: "serika dark",
      isFavorite: true,
    });
  });
});
