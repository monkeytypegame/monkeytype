import type { WallpaperThemeMode } from "@monkeytype/schemas/configs";
import { describe, expect, it } from "vitest";

import { generateNoctaliaVibrant } from "../../src/ts/utils/noctalia-palette";
import {
  generateColorsForVariant,
  readableSub,
  wallpaperThemeVariants,
} from "../../src/ts/utils/wallpaper-theme";

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

const source = 0xff6750a4;

describe("wallpaper palettes", () => {
  for (const mode of [
    "dark",
    "light",
  ] as const satisfies WallpaperThemeMode[]) {
    for (const variant of wallpaperThemeVariants) {
      const id = variant.id;
      if (id === "vibrant") continue;

      it(`keeps the ${variant.name} untyped text readable in ${mode} mode`, () => {
        const colors = generateColorsForVariant(source, id, mode);

        expect(colors).toHaveLength(10);
        for (const color of colors) {
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        }
        expect(contrast(colors[3], colors[0])).toBeGreaterThanOrEqual(3);
        expect(contrast(colors[3], colors[5])).toBeGreaterThanOrEqual(1.4);
      });
    }
  }

  it.each(["dark", "light"] as const)(
    "keeps the adjusted sub readable in %s mode",
    (mode) => {
      const colors = generateColorsForVariant(source, "tonal-spot", mode);
      const sub = readableSub(colors[3], colors[1], mode);

      expect(sub).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(sub, colors[0])).toBeGreaterThanOrEqual(3);
      expect(contrast(sub, colors[5])).toBeGreaterThanOrEqual(1.4);
    },
  );

  it("generates deterministic vibrant palettes without mutating the image", () => {
    const width = 16;
    const height = 16;
    const image = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        image[i] = x < width / 2 ? 128 : 255;
        image[i + 1] = x < width / 2 ? 0 : 128;
        image[i + 2] = x < width / 2 ? 128 : 0;
        image[i + 3] = 255;
      }
    }
    const copy = new Uint8ClampedArray(image);

    const dark = generateNoctaliaVibrant(image, width, height, "dark");
    const light = generateNoctaliaVibrant(image, width, height, "light");

    expect(generateNoctaliaVibrant(image, width, height, "dark")).toEqual(dark);
    expect(image).toEqual(copy);
    for (const color of [...Object.values(dark), ...Object.values(light)]) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(dark.background).not.toBe(light.background);
  });
});
