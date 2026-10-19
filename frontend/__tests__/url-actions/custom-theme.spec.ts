import { describe, it, expect } from "vitest";
import { readUrlAction } from "../../src/ts/url-actions/action";
import {
  customThemeLink,
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

describe("customThemeLink", () => {
  it("decodes back to the same theme", () => {
    const theme: SharedCustomTheme = {
      colors,
      background: {
        image: "https://a.b/x~.png",
        size: "cover",
        filter: [0, 1, 1, 1],
      },
    };

    expect(decodeCustomTheme(linkValue(customThemeLink(theme)))).toEqual(theme);
  });

  it("decodes back a theme without background", () => {
    expect(decodeCustomTheme(linkValue(customThemeLink({ colors })))).toEqual({
      colors,
    });
  });

  it("builds a link with the customTheme param", () => {
    expect(customThemeLink({ colors })).toBe(
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
