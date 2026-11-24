import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCustomThemesMock } = vi.hoisted(() => ({
  getCustomThemesMock: vi.fn<() => { name: string; colors: string[] }[]>(),
}));
vi.mock("../../../../src/ts/queries/custom-themes", () => ({
  getCustomThemes: getCustomThemesMock,
}));

import { ThemeIndicator } from "../../../../src/ts/components/layout/footer/ThemeIndicator";
import { getConfig, setConfigStore } from "../../../../src/ts/config/store";
import { __testing } from "../../../../src/ts/config/testing";
import { clearThemePreview, previewTheme } from "../../../../src/ts/theme";

const { replaceConfig } = __testing;

function set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
  setConfigStore(key, value);
}

function renderIndicator(): { text: () => string; hasStar: () => boolean } {
  const { container } = render(() => <ThemeIndicator />);
  return {
    text: () => container.querySelector(".text")?.textContent ?? "",
    hasStar: () => container.querySelector(".fa-star") !== null,
  };
}

describe("ThemeIndicator", () => {
  beforeEach(() => {
    replaceConfig({ theme: "serika_dark" });
    clearThemePreview();
    getCustomThemesMock.mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the theme's display name and its favorite star", () => {
    const { text, hasStar } = renderIndicator();
    expect(text()).toBe("serika dark");
    expect(hasStar()).toBe(false);

    set("favThemes", ["serika_dark"]);
    expect(hasStar()).toBe(true);
  });

  it("shows the previewed theme", () => {
    vi.useFakeTimers();
    const { text } = renderIndicator();

    previewTheme("8008");
    vi.advanceTimersByTime(250);
    expect(text()).toBe("8008");

    clearThemePreview();
    expect(text()).toBe("serika dark");
  });

  it("names the custom theme matching the configured colors", () => {
    getCustomThemesMock.mockReturnValue([
      { name: "mine", colors: [...getConfig.customThemeColors] },
    ]);
    set("customTheme", true);
    const { text, hasStar } = renderIndicator();
    expect(text()).toBe("mine (custom)");
    expect(hasStar()).toBe(false);
  });
});
