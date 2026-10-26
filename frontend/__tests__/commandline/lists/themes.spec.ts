import { describe, it, expect } from "vitest";
import { Config, setConfigStore } from "../../../src/ts/config/store";
import commands from "../../../src/ts/commandline/lists/themes";
import * as ThemeController from "../../../src/ts/controllers/theme-controller";
import { __testing } from "../../../src/ts/config/testing";
import { getTheme } from "../../../src/ts/states/theme";

describe("themes commandline list config effects", () => {
  const firstTheme = (): string | undefined =>
    commands[0]?.subgroup?.list[0]?.configValue as string | undefined;

  it("puts new favorites first", () => {
    Config.favThemes = ["nord"];
    setConfigStore("favThemes", ["nord"]);
    expect(firstTheme()).toBe("nord");

    Config.favThemes = ["nord", "8008"];
    setConfigStore("favThemes", ["nord", "8008"]);
    expect(firstTheme()).toBe("8008");
  });

  it("drops the random theme when the configured theme is re-picked", async () => {
    __testing.replaceConfig({ theme: "serika_dark", randomTheme: "on" });
    await ThemeController.randomizeTheme();
    expect(ThemeController.randomTheme).not.toBeNull();

    commands[0]?.subgroup?.list
      .find((command) => command.configValue === "serika_dark")
      ?.exec?.({});

    expect(ThemeController.randomTheme).toBeNull();
    expect(getTheme().name).toBe("serika_dark");
  });
});
