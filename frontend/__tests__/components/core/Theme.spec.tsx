import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";

import { render, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Theme } from "../../../src/ts/components/core/Theme";
import { setFullConfigStore } from "../../../src/ts/config/store";
import { getDefaultConfig } from "../../../src/ts/constants/default-config";
import { ThemeWithName } from "../../../src/ts/constants/themes";
import * as Loader from "../../../src/ts/states/loader-bar";
import * as Notifications from "../../../src/ts/states/notifications";
import * as TestState from "../../../src/ts/states/test";
import * as ThemeSignal from "../../../src/ts/states/theme";

vi.mock("../../../src/ts/constants/themes", () => ({
  themes: {
    dark: { hasCss: true },
    light: {},
  },
}));

// opens indexedDB on import, which jsdom lacks
const fileStorage = vi.hoisted(() => ({
  localBackground: undefined as string | undefined,
}));
vi.mock("../../../src/ts/utils/file-storage", () => ({
  default: {
    track: () => 0,
    getFile: async () => fileStorage.localBackground,
  },
}));

// the real test state pulls in the whole typing test
vi.mock("../../../src/ts/states/test", () => ({
  setErrorBorderDisabled: vi.fn(),
}));

vi.mock("./FavIcon", () => ({
  FavIcon: () => <div id="favicon" />,
}));

describe("Theme component", () => {
  const [themeSignal, setThemeSignal] = createSignal<ThemeWithName>({} as any);
  const themeSignalMock = vi.spyOn(ThemeSignal, "getTheme");
  const loaderShowMock = vi.spyOn(Loader, "showLoaderBar");
  const loaderHideMock = vi.spyOn(Loader, "hideLoaderBar");
  const notificationAddMock = vi.spyOn(Notifications, "showNoticeNotification");
  const errorBorderMock = vi.mocked(TestState.setErrorBorderDisabled);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    loaderShowMock.mockClear();
    loaderHideMock.mockClear();
    notificationAddMock.mockClear();
    themeSignalMock.mockImplementation(() => themeSignal());
    fileStorage.localBackground = undefined;
    ThemeSignal.setCustomBackgroundFilterPreview(undefined);
    setConfig({
      customBackground: "",
      customBackgroundSize: "cover",
      customBackgroundFilter: [0, 1, 1, 1],
    });
    setThemeSignal({
      name: "dark",
      bg: "#000",
      main: "#fff",
      caret: "#fff",
      sub: "#aaa",
      subAlt: "#888",
      text: "#fff",
      error: "#f00",
      errorExtra: "#c00",
      colorfulError: "#f55",
      colorfulErrorExtra: "#c55",
    });
  });

  it("injects CSS variables based on theme", () => {
    const { style } = renderComponent();

    expect(style.innerHTML).toEqual(`
:root {
    --bg-color: #000;
    --main-color: #fff;
    --caret-color: #fff;
    --sub-color: #aaa;
    --sub-alt-color: #888;
    --text-color: #fff;
    --error-color: #f00;
    --error-extra-color: #c00;
    --colorful-error-color: #f55;
    --colorful-error-extra-color: #c55;
}`);
  });

  it("updates CSS variables based on signal", () => {
    setThemeSignal({ name: "light", bg: "#f00" } as any);
    const { style } = renderComponent();

    expect(style.innerHTML).toContain("--bg-color: #f00;");
  });

  it("loads CSS file and shows loader when theme has CSS", () => {
    const { css } = renderComponent();

    expect(css.getAttribute("href")).toBe("/themes/dark.css");
    expect(loaderShowMock).toHaveBeenCalledOnce();
    fireEvent.load(css);
    expect(loaderHideMock).toHaveBeenCalledOnce();
  });

  it("removes CSS when theme has no CSS", async () => {
    setThemeSignal((prev) => ({
      ...prev,
      name: "light" as ThemeWithName["name"],
    }));
    const { css } = renderComponent();
    expect(css).not.toBeInTheDocument();
  });

  it("removes CSS when theme is custom", async () => {
    setThemeSignal((prev) => ({
      ...prev,
      name: "custom" as ThemeWithName["name"],
    }));
    const { css } = renderComponent();
    expect(css).not.toBeInTheDocument();
  });

  it("handles CSS load error", () => {
    const { css } = renderComponent();
    expect(loaderShowMock).toHaveBeenCalledOnce();
    fireEvent.error(css);
    expect(loaderHideMock).toHaveBeenCalledOnce();
    expect(notificationAddMock).toHaveBeenCalledWith("Failed to load theme");
  });

  it("renders favicon", () => {
    const { favIcon } = renderComponent();

    expect(favIcon).toBeInTheDocument();
    expect(favIcon).toBeEmptyDOMElement(); //mocked
  });

  it("marks the body dark for a dark background", () => {
    renderComponent();
    expect(document.body).toHaveClass("darkMode");

    setThemeSignal((prev) => ({ ...prev, bg: "#fff" }));
    expect(document.body).not.toHaveClass("darkMode");
  });

  describe("custom background", () => {
    it("shows no image without a background", async () => {
      renderComponent();
      await flushPromises();

      expect(backgroundImage()).toBeNull();
      expect(errorBorderMock).toHaveBeenLastCalledWith(false);
    });

    it("shows the config url", async () => {
      setConfig({ customBackground: "https://a.b/c.png" });
      renderComponent();
      await flushPromises();

      expect(backgroundImage()?.getAttribute("src")).toBe("https://a.b/c.png");
      expect(errorBorderMock).toHaveBeenLastCalledWith(true);
    });

    it("prefers a local background file", async () => {
      setConfig({ customBackground: "https://a.b/c.png" });
      fileStorage.localBackground = "data:image/png;base64,abc";
      renderComponent();
      await flushPromises();

      expect(backgroundImage()?.getAttribute("src")).toBe(
        "data:image/png;base64,abc",
      );
    });

    it("applies size and filters, the preview while dragging", async () => {
      setConfig({
        customBackground: "https://a.b/c.png",
        customBackgroundSize: "contain",
        customBackgroundFilter: [1, 1, 1, 0.5],
      });
      renderComponent();
      await flushPromises();

      expect(backgroundImage()?.style.objectFit).toBe("contain");
      expect(backgroundImage()?.style.filter).toBe("blur(1rem) opacity(0.5)");

      ThemeSignal.setCustomBackgroundFilterPreview([0, 2, 1, 1]);
      expect(backgroundImage()?.style.filter).toBe("brightness(2)");

      // saving the value drops the preview
      setConfig({ customBackgroundFilter: [0, 1, 1, 1] });
      expect(ThemeSignal.getCustomBackgroundFilterPreview()).toBeUndefined();
    });

    it("hides a failed image and tells the user", async () => {
      setConfig({ customBackground: "https://a.b/c.png" });
      renderComponent();
      await flushPromises();

      fireEvent.error(backgroundImage() as HTMLImageElement);

      expect(backgroundImage()?.style.display).toBe("none");
      expect(notificationAddMock).toHaveBeenCalledWith(
        expect.stringContaining("Custom background link"),
        { durationMs: 5000 },
      );
    });

    function backgroundImage(): HTMLImageElement | null {
      // document.querySelector is mocked (mock-dom.ts)
      return document.body.querySelector(".customBackground img");
    }
  });

  // the reactive config store, which the component reads
  function setConfig(config: Partial<ConfigSchema>): void {
    setFullConfigStore({ ...getDefaultConfig(), ...config });
  }

  async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  function renderComponent(): {
    style: HTMLStyleElement;
    css: HTMLLinkElement;
    metaThemeColor: HTMLMetaElement;
    favIcon: HTMLElement;
  } {
    render(() => <Theme />);

    //wait for debounce
    vi.runAllTimers();

    //make sure content is rendered to the head, not the body
    const head = document.head;

    return {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      style: head.querySelector("style#theme")!,
      // oxlint-disable-next-line typescript/no-non-null-assertion
      css: head.querySelector("link#currentTheme")!,
      // oxlint-disable-next-line typescript/no-non-null-assertion
      metaThemeColor: head.querySelector("meta#metaThemeColor")!,
      // oxlint-disable-next-line typescript/no-non-null-assertion
      favIcon: head.querySelector("#favicon")!,
    };
  }
});
