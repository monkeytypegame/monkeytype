import { render, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Theme } from "../../../src/ts/components/layout/Theme";
import { ThemeWithName } from "../../../src/ts/constants/themes";
import * as Notifications from "../../../src/ts/elements/notifications";
import * as Loader from "../../../src/ts/signals/loader-bar";
import * as ThemeSignal from "../../../src/ts/signals/theme";

vi.mock("../../../src/ts/constants/themes", () => ({
  themes: {
    dark: { hasCss: true },
    light: {},
  },
}));

vi.mock("./FavIcon", () => ({
  FavIcon: () => <div id="favicon" />,
}));

describe("Theme component", () => {
  const [themeSignal, setThemeSignal] = createSignal<ThemeWithName>({} as any);
  const themeSignalMock = vi.spyOn(ThemeSignal, "getTheme");
  const loaderShowMock = vi.spyOn(Loader, "showLoaderBar");
  const loaderHideMock = vi.spyOn(Loader, "hideLoaderBar");
  const notificationAddMock = vi.spyOn(Notifications, "add");

  beforeEach(() => {
    vi.clearAllMocks();
    loaderShowMock.mockClear();
    loaderHideMock.mockClear();
    notificationAddMock.mockClear();
    themeSignalMock.mockImplementation(() => themeSignal());
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
    themeSignalMock.mockImplementation(() => ({ name: "light" }) as any);
    const { css } = renderComponent();
    expect(css.getAttribute("href")).toBe("");
  });

  it("removes CSS when theme is custom", async () => {
    themeSignalMock.mockImplementation(() => ({ name: "custom" }) as any);
    const { css } = renderComponent();
    expect(css.getAttribute("href")).toBe("");
  });

  it("handles CSS load error", () => {
    const { css } = renderComponent();
    expect(loaderShowMock).toHaveBeenCalledOnce();
    fireEvent.error(css);
    expect(loaderHideMock).toHaveBeenCalledOnce();
    expect(notificationAddMock).toHaveBeenCalledWith("Failed to load theme", 0);
  });

  it("renders favicon", () => {
    const { favIcon } = renderComponent();

    expect(favIcon).toBeInTheDocument();
    expect(favIcon).toBeEmptyDOMElement(); //mocked
  });

  function renderComponent(): {
    style: HTMLStyleElement;
    css: HTMLLinkElement;
    metaThemeColor: HTMLMetaElement;
    favIcon: HTMLElement;
  } {
    render(() => <Theme />);

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
