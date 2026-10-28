import { describe, it, expect, beforeEach } from "vitest";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import * as ThemeController from "../../src/ts/controllers/theme-controller";
import { Config, setConfigStore } from "../../src/ts/config/store";
import { __testing } from "../../src/ts/config/testing";
import { getTheme } from "../../src/ts/states/theme";
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

    expect(ThemeController.randomTheme).not.toBeNull();
    expect(getTheme().name).toBe(ThemeController.randomTheme);
    expect(Config.customTheme).toBe(false);
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
