import { describe, expect, it } from "vitest";

import { themes } from "../../src/ts/constants/themes";

const luminance = (hex: string): number => {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4]
    .map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4),
    );
  return (
    0.2126 * (channels[0] ?? 0) +
    0.7152 * (channels[1] ?? 0) +
    0.0722 * (channels[2] ?? 0)
  );
};

const contrast = (a: string, b: string): number => {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

describe("theme colors", () => {
  it("keeps untyped text readable on every theme", () => {
    const failures: string[] = [];
    for (const [name, theme] of Object.entries(themes)) {
      const onBackground = contrast(theme.sub, theme.bg);
      const onText = contrast(theme.sub, theme.text);
      if (onBackground < 3) {
        failures.push(`${name}: sub/bg ${onBackground.toFixed(3)}`);
      }
      if (onText < 1.4) {
        failures.push(`${name}: sub/text ${onText.toFixed(3)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
