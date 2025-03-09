/**
 * Utility functions for color conversions and operations.
 */

import { normal as normalBlend } from "color-blend";

/**
 * Blends two hexadecimal colors with a given opacity.
 * @param color1 The first hexadecimal color value.
 * @param color2 The second hexadecimal color value.
 * @param opacity The opacity value between 0 and 1.
 * @returns A new hexadecimal color value representing the blend of color1 and color2.
 */
export function blendTwoHexColors(
  color1: string,
  color2: string,
  opacity: number
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (rgb1 && rgb2) {
    const rgba1 = {
      r: rgb1.r,
      g: rgb1.g,
      b: rgb1.b,
      a: 1,
    };
    const rgba2 = {
      r: rgb2.r,
      g: rgb2.g,
      b: rgb2.b,
      a: opacity,
    };
    const blended = normalBlend(rgba1, rgba2);
    return rgbToHex(blended.r, blended.g, blended.b);
  } else {
    return "#000000";
  }
}

/**
 * Converts a hexadecimal color string to an RGB object.
 * @param hex The hexadecimal color string (e.g., "#ff0000" or "#f00").
 * @returns An object with 'r', 'g', and 'b' properties representing the red, green, and blue components of the color, or undefined if the input is invalid.
 */
export function hexToRgb(hex: string):
  | {
      r: number;
      g: number;
      b: number;
    }
  | undefined {
  if ((hex.length !== 4 && hex.length !== 7) || !hex.startsWith("#")) {
    return undefined;
  }
  let r: number;
  let g: number;
  let b: number;
  if (hex.length === 4) {
    r = Number("0x" + hex[1] + hex[1]);
    g = Number("0x" + hex[2] + hex[2]);
    b = Number("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = Number("0x" + hex[1] + hex[2]);
    g = Number("0x" + hex[3] + hex[4]);
    b = Number("0x" + hex[5] + hex[6]);
  } else {
    return undefined;
  }

  return { r, g, b };
}

/**
 * Converts RGB values to a hexadecimal color string.
 * @param r The red component (0-255).
 * @param g The green component (0-255).
 * @param b The blue component (0-255).
 * @returns The hexadecimal color string (e.g., "#ff0000" for red).
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Converts a hexadecimal color string to its HSL (Hue, Saturation, Lightness) representation.
 * @param hex The hexadecimal color string (e.g., "#ff0000" or "#f00").
 * @returns An object with 'hue', 'sat', 'lgt', and 'string' properties representing the HSL values and an HSL string representation.
 */
export function hexToHSL(hex: string): {
  hue: number;
  sat: number;
  lgt: number;
  string: string;
} {
  // Convert hex to RGB first
  let r: number;
  let g: number;
  let b: number;
  if (hex.length === 4) {
    r = ("0x" + hex[1] + hex[1]) as unknown as number;
    g = ("0x" + hex[2] + hex[2]) as unknown as number;
    b = ("0x" + hex[3] + hex[3]) as unknown as number;
  } else if (hex.length === 7) {
    r = ("0x" + hex[1] + hex[2]) as unknown as number;
    g = ("0x" + hex[3] + hex[4]) as unknown as number;
    b = ("0x" + hex[5] + hex[6]) as unknown as number;
  } else {
    r = 0x00;
    g = 0x00;
    b = 0x00;
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return {
    hue: h,
    sat: s,
    lgt: l,
    string: "hsl(" + h + "," + s + "%," + l + "%)",
  };
}

/**
 * Checks if a color is considered light based on its hexadecimal representation.
 * @param hex The hexadecimal color string.
 * @returns True if the color is considered light, false otherwise.
 */
export function isColorLight(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.lgt >= 50;
}

/**
 * Checks if a color is considered dark based on its hexadecimal representation.
 * @param hex The hexadecimal color string.
 * @returns True if the color is considered dark, false otherwise.
 */
export function isColorDark(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.lgt < 50;
}

/**
 * Converts an RGB string (e.g., "rgb(255, 0, 0)") to a hexadecimal color string.
 * @param rgb The RGB string.
 * @returns The equivalent hexadecimal color string.
 */
export function rgbStringtoHex(rgb: string): string | undefined {
  const match: RegExpMatchArray | null = rgb.match(
    /^rgb\((\d+), \s*(\d+), \s*(\d+)\)$/
  );
  if (match === null) return;
  if (match.length < 3) return;
  function hexCode(i: string): string {
    // Take the last 2 characters and convert
    // them to Hexadecimal.
    return ("0" + parseInt(i).toString(16)).slice(-2);
  }
  return (
    "#" +
    hexCode(match[1] as string) +
    hexCode(match[2] as string) +
    hexCode(match[3] as string)
  );
}
