/**
 * Utility functions for color conversions and operations.
 */

/**
 * Blends two hexadecimal colors with a given opacity.
 * @param color1 The first hexadecimal color value (supports alpha channel).
 * @param color2 The second hexadecimal color value (supports alpha channel).
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
    // Simple alpha blending: result = color1 * (1 - opacity) + color2 * opacity
    const alpha1 = rgb1.a ?? 1;
    const alpha2 = rgb2.a ?? 1;

    // Blend the colors
    const blendedR = Math.round(rgb1.r * (1 - opacity) + rgb2.r * opacity);
    const blendedG = Math.round(rgb1.g * (1 - opacity) + rgb2.g * opacity);
    const blendedB = Math.round(rgb1.b * (1 - opacity) + rgb2.b * opacity);

    // Blend the alpha channels
    const blendedA = alpha1 * (1 - opacity) + alpha2 * opacity;

    // If either color had alpha or the blended alpha is not 1, include alpha in result
    if (rgb1.a !== undefined || rgb2.a !== undefined || blendedA !== 1) {
      return rgbToHex(blendedR, blendedG, blendedB, blendedA);
    } else {
      return rgbToHex(blendedR, blendedG, blendedB);
    }
  } else {
    return "#ff00ffff";
  }
}

/**
 * Converts a hexadecimal color string to an RGB/RGBA object.
 * @param hex The hexadecimal color string (e.g., "#ff0000", "#f00", "#ff0000ff", or "#f00f").
 * @returns An object with 'r', 'g', 'b', and optionally 'a' properties representing the red, green, blue, and alpha components of the color, or undefined if the input is invalid.
 */
export function hexToRgb(hex: string):
  | {
      r: number;
      g: number;
      b: number;
      a?: number;
    }
  | undefined {
  if (
    (hex.length !== 4 &&
      hex.length !== 5 &&
      hex.length !== 7 &&
      hex.length !== 9) ||
    !hex.startsWith("#")
  ) {
    return undefined;
  }
  let r: number;
  let g: number;
  let b: number;
  let a: number | undefined;

  if (hex.length === 4) {
    // #RGB format
    r = Number("0x" + hex[1] + hex[1]);
    g = Number("0x" + hex[2] + hex[2]);
    b = Number("0x" + hex[3] + hex[3]);
  } else if (hex.length === 5) {
    // #RGBA format
    r = Number("0x" + hex[1] + hex[1]);
    g = Number("0x" + hex[2] + hex[2]);
    b = Number("0x" + hex[3] + hex[3]);
    a = Number("0x" + hex[4] + hex[4]) / 255;
  } else if (hex.length === 7) {
    // #RRGGBB format
    r = Number("0x" + hex[1] + hex[2]);
    g = Number("0x" + hex[3] + hex[4]);
    b = Number("0x" + hex[5] + hex[6]);
  } else if (hex.length === 9) {
    // #RRGGBBAA format
    r = Number("0x" + hex[1] + hex[2]);
    g = Number("0x" + hex[3] + hex[4]);
    b = Number("0x" + hex[5] + hex[6]);
    a = Number("0x" + hex[7] + hex[8]) / 255;
  } else {
    return undefined;
  }

  const result: { r: number; g: number; b: number; a?: number } = { r, g, b };
  if (a !== undefined) {
    result.a = a;
  }
  return result;
}

/**
 * Converts RGB/RGBA values to a hexadecimal color string.
 * @param r The red component (0-255).
 * @param g The green component (0-255).
 * @param b The blue component (0-255).
 * @param a The alpha component (0-1), optional.
 * @returns The hexadecimal color string (e.g., "#ff0000" for red or "#ff0000ff" for red with full opacity).
 */
function rgbToHex(r: number, g: number, b: number, a?: number): string {
  const hexR = Math.round(r).toString(16).padStart(2, "0");
  const hexG = Math.round(g).toString(16).padStart(2, "0");
  const hexB = Math.round(b).toString(16).padStart(2, "0");

  if (a !== undefined) {
    const hexA = Math.round(a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${hexR}${hexG}${hexB}${hexA}`;
  }

  return `#${hexR}${hexG}${hexB}`;
}

/**
 * Converts a hexadecimal color string to its HSL (Hue, Saturation, Lightness) representation.
 * @param hex The hexadecimal color string (e.g., "#ff0000", "#f00", "#ff0000ff", or "#f00f").
 * @returns An object with 'hue', 'sat', 'lgt', 'alpha', and 'string' properties representing the HSL values and an HSL string representation.
 */
export function hexToHSL(hex: string): {
  hue: number;
  sat: number;
  lgt: number;
  alpha?: number;
  string: string;
} {
  // Convert hex to RGB first
  let r: number;
  let g: number;
  let b: number;
  let a: number | undefined;

  if (hex.length === 4) {
    // #RGB format
    r = ("0x" + hex[1] + hex[1]) as unknown as number;
    g = ("0x" + hex[2] + hex[2]) as unknown as number;
    b = ("0x" + hex[3] + hex[3]) as unknown as number;
  } else if (hex.length === 5) {
    // #RGBA format
    r = ("0x" + hex[1] + hex[1]) as unknown as number;
    g = ("0x" + hex[2] + hex[2]) as unknown as number;
    b = ("0x" + hex[3] + hex[3]) as unknown as number;
    a = (("0x" + hex[4] + hex[4]) as unknown as number) / 255;
  } else if (hex.length === 7) {
    // #RRGGBB format
    r = ("0x" + hex[1] + hex[2]) as unknown as number;
    g = ("0x" + hex[3] + hex[4]) as unknown as number;
    b = ("0x" + hex[5] + hex[6]) as unknown as number;
  } else if (hex.length === 9) {
    // #RRGGBBAA format
    r = ("0x" + hex[1] + hex[2]) as unknown as number;
    g = ("0x" + hex[3] + hex[4]) as unknown as number;
    b = ("0x" + hex[5] + hex[6]) as unknown as number;
    a = (("0x" + hex[7] + hex[8]) as unknown as number) / 255;
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

  const result: {
    hue: number;
    sat: number;
    lgt: number;
    alpha?: number;
    string: string;
  } = {
    hue: h,
    sat: s,
    lgt: l,
    string:
      a !== undefined
        ? `hsla(${h}, ${s}%, ${l}%, ${a.toFixed(3)})`
        : `hsl(${h}, ${s}%, ${l}%)`,
  };

  if (a !== undefined) {
    result.alpha = a;
  }

  return result;
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
