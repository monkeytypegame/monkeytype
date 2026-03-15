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
  opacity: number,
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
export function rgbToHex(r: number, g: number, b: number, a?: number): string {
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

export function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 *  some system color pickers return rgb or hsl values. We need to convert them to hex before storing
 * @param color as hex, hsl or rgb
 * @returns  hex color
 * @throws if the input color is not valid
 */
export function convertStringToHex(color: string): string {
  const input = color.trim().toLocaleLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(input)) {
    return input;
  }

  if (/^#[0-9a-f]{3}$/i.test(input)) {
    // Expand #rgb → #rrggbb
    return (
      "#" + input[1] + input[1] + input[2] + input[2] + input[3] + input[3]
    );
  }

  const rgbMatch =
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(input) ??
    /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/.exec(input);

  if (rgbMatch !== null) {
    const clamp = (n: string): number =>
      Math.max(0, Math.min(255, Number.parseFloat(n)));

    const r = clamp(rgbMatch[1] as string);
    const g = clamp(rgbMatch[2] as string);
    const b = clamp(rgbMatch[3] as string);
    return rgbToHex(r, g, b);
  }

  const hslMatch =
    /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.exec(input) ??
    /^(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%$/.exec(input);

  if (hslMatch) {
    const clamp = (n: string): number =>
      Math.max(0, Math.min(255, Number.parseFloat(n)));
    const h = Number.parseFloat(hslMatch[1] as string) % 360;
    const s = clamp(hslMatch[2] as string) / 100;
    const l = clamp(hslMatch[3] as string) / 100;
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  }
  throw new Error(`Invalid color format: ${color}`);
}
