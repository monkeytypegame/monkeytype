import { describe, it, expect, vi } from "vitest";
import { getConfig } from "../../src/ts/config/store";

// a write that throws, to exercise the rollback
const failOn = vi.hoisted(() => ({ key: null as string | null }));
vi.mock("../../src/ts/config/setters", async (importOriginal) => {
  const setters =
    await importOriginal<typeof import("../../src/ts/config/setters")>();
  return {
    ...setters,
    setConfig: ((key, value, options) => {
      if (key === failOn.key) throw new Error(`can't set ${key}`);
      return setters.setConfig(key, value, options);
    }) as typeof setters.setConfig,
  };
});
import { readUrlAction } from "../../src/ts/url-actions/action";
import {
  buildCustomThemeLink,
  customThemeAction,
  SharedCustomTheme,
} from "../../src/ts/url-actions/actions/custom-theme";

function decodeCustomTheme(value: string): SharedCustomTheme {
  const read = readUrlAction(customThemeAction, { customTheme: value });
  if (!read.success) throw new Error(read.error);
  return read.data;
}

const linkValue = (link: string): string => link.slice(link.indexOf("=") + 1);

const colors = new Array(10).fill("#111111") as SharedCustomTheme["colors"];

describe("buildCustomThemeLink", () => {
  it("decodes back to the same theme", () => {
    const theme: SharedCustomTheme = {
      colors,
      background: {
        image: "https://a.b/x~.png",
        size: "cover",
        filter: [0, 1, 1, 1],
      },
    };

    expect(decodeCustomTheme(linkValue(buildCustomThemeLink(theme)))).toEqual(
      theme,
    );
  });

  it("decodes back a theme without background", () => {
    expect(
      decodeCustomTheme(linkValue(buildCustomThemeLink({ colors }))),
    ).toEqual({
      colors,
    });
  });

  it("builds a link with the customTheme param", () => {
    expect(buildCustomThemeLink({ colors })).toBe(
      `${location.origin}?customTheme=${btoa(JSON.stringify({ c: colors }))}`,
    );
  });
});

describe("reading customThemeAction", () => {
  it("decodes the old format, the colors only", () => {
    expect(decodeCustomTheme(btoa(JSON.stringify(colors)))).toEqual({ colors });
  });

  it("rejects invalid base64", () => {
    expect(() => decodeCustomTheme("%%%")).toThrow('"customTheme"');
  });

  it("rejects a theme without colors", () => {
    expect(() => decodeCustomTheme(btoa(JSON.stringify({})))).toThrow();
  });
});

describe("applying customThemeAction", () => {
  it("rolls the colors back when a later write fails", () => {
    const before = [...getConfig.customThemeColors];
    failOn.key = "customBackground";
    try {
      // apply throws synchronously
      expect(() => {
        void customThemeAction.apply({
          // varied: a palette of one color is replaced by the default
          colors: Array.from(
            { length: 10 },
            (_, i) => `#${i}${i}${i}${i}${i}${i}`,
          ) as SharedCustomTheme["colors"],
          background: { image: "", size: "cover", filter: [0, 1, 1, 1] },
        });
      }).toThrow("can't set customBackground");
    } finally {
      failOn.key = null;
    }
    expect([...getConfig.customThemeColors]).toEqual(before);
  });
});
