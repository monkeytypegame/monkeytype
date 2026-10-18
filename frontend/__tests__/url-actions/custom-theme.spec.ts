import { describe, it, expect } from "vitest";
import {
  customThemeLink,
  decodeCustomTheme,
  encodeCustomTheme,
  SharedCustomTheme,
} from "../../src/ts/url-actions/actions/custom-theme";

const colors = new Array(10).fill("#111111") as SharedCustomTheme["colors"];

describe("encodeCustomTheme", () => {
  it("decodes back to the same theme", () => {
    const theme: SharedCustomTheme = {
      colors,
      background: {
        image: "https://a.b/x~.png",
        size: "cover",
        filter: [0, 1, 1, 1],
      },
    };

    expect(decodeCustomTheme(encodeCustomTheme(theme))).toEqual(theme);
  });

  it("decodes back a theme without background", () => {
    expect(decodeCustomTheme(encodeCustomTheme({ colors }))).toEqual({
      colors,
    });
  });

  it("builds a link with the customTheme param", () => {
    expect(customThemeLink({ colors })).toBe(
      `${location.origin}?customTheme=${encodeCustomTheme({ colors })}`,
    );
  });
});

describe("decodeCustomTheme", () => {
  it("decodes the old format, the colors only", () => {
    expect(decodeCustomTheme(btoa(JSON.stringify(colors)))).toEqual({ colors });
  });

  it("throws without colors", () => {
    expect(() => decodeCustomTheme(btoa(JSON.stringify({})))).toThrow();
  });
});
