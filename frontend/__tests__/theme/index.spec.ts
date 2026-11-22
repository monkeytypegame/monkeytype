import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import {
  clearThemePreview,
  previewTheme,
  randomizeTheme,
} from "../../src/ts/theme";
import { Config, setConfigStore } from "../../src/ts/config/store";
import { setConfig } from "../../src/ts/config/setters";
import { applyConfig } from "../../src/ts/config/lifecycle";
import { __testing } from "../../src/ts/config/testing";
import {
  getRandomTheme,
  getTheme,
  setCustomThemeDraft,
  updateCustomThemeDraftColor,
} from "../../src/ts/theme/state";
import { themes } from "../../src/ts/constants/themes";

const { customThemes } = vi.hoisted(() => ({
  customThemes: [] as { _id: string; name: string; colors: string[] }[],
}));
vi.mock("../../src/ts/queries/custom-themes", () => ({
  getCustomThemes: () => customThemes,
  getCustomTheme: (id: string) => customThemes.find((ct) => ct._id === id),
}));

const { replaceConfig } = __testing;

function set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
  Config[key] = value;
  setConfigStore(key, value);
}

describe("theme", () => {
  beforeEach(() => {
    replaceConfig({ theme: "serika_dark" });
    clearThemePreview();
    setCustomThemeDraft(null);
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

  it("keeps the random theme over a custom theme", () => {
    set("customTheme", true);
    set("randomTheme", "on");

    randomizeTheme();

    expect(getRandomTheme()).not.toBeNull();
    expect(getTheme().name).toBe(getRandomTheme()?.name);
    expect(Config.customTheme).toBe(false);
  });

  it("picks a random custom theme", () => {
    const colors = [...Config.customThemeColors];
    colors[0] = "#0a0b0c";
    customThemes.splice(0, customThemes.length, {
      _id: "id1",
      name: "mine",
      colors,
    });
    // setConfig blocks "custom" while signed out
    set("randomTheme", "custom");

    randomizeTheme();

    expect(getTheme().name).toBe("custom");
    expect(getTheme().bg).toBe("#0a0b0c");
    customThemes.length = 0;
  });

  describe("while a random theme is active", () => {
    beforeEach(() => {
      replaceConfig({ theme: "serika_dark", randomTheme: "on" });
      randomizeTheme();
      expect(getRandomTheme()).not.toBeNull();
    });

    it("picks a new one each time", () => {
      const before = getRandomTheme();
      randomizeTheme();
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

    it("falls back to the auto switch theme when turned off", () => {
      replaceConfig({
        theme: "serika_dark",
        randomTheme: "on",
        autoSwitchTheme: true,
        themeLight: "nord_light",
        themeDark: "nord_light",
      });
      randomizeTheme();
      expect(getRandomTheme()).not.toBeNull();

      setConfig("randomTheme", "off");
      expect(getTheme().name).toBe("nord_light");
    });
  });

  describe("preview", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows after the debounce, over a random theme", () => {
      replaceConfig({ theme: "serika_dark", randomTheme: "on" });
      randomizeTheme();

      previewTheme("8008");
      expect(getTheme().name).not.toBe("8008");
      vi.advanceTimersByTime(250);
      expect(getTheme().name).toBe("8008");

      clearThemePreview();
      expect(getTheme().name).toBe(getRandomTheme()?.name);
    });

    it("previews custom colors", () => {
      const colors = [
        ...Config.customThemeColors,
      ] as ConfigType["customThemeColors"];
      colors[0] = "#abcdef";
      previewTheme("custom", colors);
      vi.advanceTimersByTime(250);
      expect(getTheme().bg).toBe("#abcdef");
    });

    it("is dropped by a pending clear", () => {
      previewTheme("8008");
      clearThemePreview();
      vi.advanceTimersByTime(250);
      expect(getTheme().name).toBe("serika_dark");
    });
  });

  describe("custom theme draft", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      set("customTheme", true);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows the unsaved colors", () => {
      updateCustomThemeDraftColor("bg", "#111111");
      expect(getTheme().bg).toBe("#111111");
      expect(getTheme().name).toBe("custom");
    });

    it("applies only while the custom theme is on", () => {
      updateCustomThemeDraftColor("bg", "#111111");
      set("customTheme", false);
      expect(getTheme().bg).toBe(themes.serika_dark.bg);
    });

    it("survives a cleared preview", () => {
      updateCustomThemeDraftColor("bg", "#111111");
      previewTheme("8008");
      vi.advanceTimersByTime(250);
      expect(getTheme().name).toBe("8008");

      clearThemePreview();
      expect(getTheme().bg).toBe("#111111");
    });

    it("is dropped when the custom colors are saved", () => {
      updateCustomThemeDraftColor("bg", "#111111");
      const colors = [
        ...Config.customThemeColors,
      ] as ConfigType["customThemeColors"];
      colors[1] = "#222222";
      set("customThemeColors", colors);
      expect(getTheme().bg).toBe(colors[0]);
      expect(getTheme().main).toBe("#222222");
    });
  });
});
