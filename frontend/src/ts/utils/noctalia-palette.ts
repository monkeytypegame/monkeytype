/**
 * Noctalia's custom "vibrant" wallpaper scheme, ported from the desktop
 * shell (theme/custom_schemes.cpp plus its color/contrast helpers).
 *
 * Material's SchemeVibrant uses a different seed extraction, so the palette
 * never matched the rest of the session. This port keeps Monkeytype and the
 * shell on the same pipeline: box-resize to 112x112, k-means in Lab space,
 * chroma scoring, then the HSL token map.
 */
import { Hct } from "@material/material-color-utilities";

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };
type Lab = { l: number; a: number; b: number };
type Cluster = { centroid: Rgb; count: number };
type Scored = { color: Rgb; score: number };
type Oklch = { lightness: number; chroma: number; hue: number };
type LinearRgb = { r: number; g: number; b: number };

const TARGET_SIZE = 112;
const CLUSTER_COUNT = 20;
const KMEANS_ITERATIONS = 10;
const MIN_CHROMA = 5;
const FALLBACK = "#6750A4";
const FALLBACK_ERROR = "#FD4663";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function round255(value: number): number {
  return clamp(Math.round(value * 255), 0, 255);
}

function toHex(color: Rgb): string {
  const channel = (value: number): string =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

function toArgb(color: Rgb): number {
  return (
    ((Math.round(clamp(color.r, 0, 255)) << 16) |
      (Math.round(clamp(color.g, 0, 255)) << 8) |
      Math.round(clamp(color.b, 0, 255)) |
      0xff000000) >>>
    0
  );
}

function toHsl(color: Rgb): Hsl {
  const rn = color.r / 255;
  const gn = color.g / 255;
  const bn = color.b / 255;
  const maxC = Math.max(rn, gn, bn);
  const minC = Math.min(rn, gn, bn);
  const delta = maxC - minC;
  const l = (maxC + minC) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    if (l !== 0 && l !== 1) {
      s = delta / (1 - Math.abs(2 * l - 1));
    }
    if (maxC === rn) {
      let t = ((gn - bn) / delta) % 6;
      if (t < 0) t += 6;
      h = 60 * t;
    } else if (maxC === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }
  return { h, s, l };
}

function fromHsl(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = round255(l);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  const hueToRgb = (raw: number): number => {
    let t = raw;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: round255(hueToRgb(hn + 1 / 3)),
    g: round255(hueToRgb(hn)),
    b: round255(hueToRgb(hn - 1 / 3)),
  };
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function shiftHue(color: Rgb, degrees: number): Rgb {
  const hsl = toHsl(color);
  let h = (hsl.h + degrees) % 360;
  if (h < 0) h += 360;
  return fromHsl(h, hsl.s, hsl.l);
}

function adjustSurface(base: Rgb, sMax: number, lTarget: number): Rgb {
  const hsl = toHsl(base);
  return fromHsl(hsl.h, Math.min(hsl.s, sMax), lTarget);
}

// ── Lab (D65) ──────────────────────────────────────────────────────────

function linearize(channel: number): number {
  const n = channel / 255;
  if (n <= 0.04045) return n / 12.92;
  return Math.pow((n + 0.055) / 1.055, 2.4);
}

function delinearize(value: number): number {
  if (value <= 0.0031308) return value * 12.92;
  return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function labF(t: number): number {
  if (t > 0.008856) return Math.cbrt(t);
  return (903.3 * t + 16) / 116;
}

function labFInv(t: number): number {
  if (t > 0.206893) return t * t * t;
  return (116 * t - 16) / 903.3;
}

function rgbToLab(color: Rgb): Lab {
  const lr = linearize(color.r);
  const lg = linearize(color.g);
  const lb = linearize(color.b);
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) * 100;
  const y = (0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb) * 100;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) * 100;
  const fx = labF(x / 95.047);
  const fy = labF(y / 100);
  const fz = labF(z / 108.883);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function labToRgb(lab: Lab): Rgb {
  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  const x = (95.047 * labFInv(fx)) / 100;
  const y = (100 * labFInv(fy)) / 100;
  const z = (108.883 * labFInv(fz)) / 100;
  let lr = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  let lg = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  let lb = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  lr = clamp(lr, 0, 1);
  lg = clamp(lg, 0, 1);
  lb = clamp(lb, 0, 1);
  const channel = (v: number): number =>
    clamp(Math.round(delinearize(v) * 255), 0, 255);
  return { r: channel(lr), g: channel(lg), b: channel(lb) };
}

function labDistance(a: Lab, b: Lab): number {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// ── OKLCH + WCAG contrast ──────────────────────────────────────────────

function toOklch(color: Rgb): Oklch {
  const red = linearize(color.r);
  const green = linearize(color.g);
  const blue = linearize(color.b);
  const l = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const m = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const s = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { lightness, chroma: Math.hypot(a, b), hue: Math.atan2(b, a) };
}

function fromOklch(color: Oklch): LinearRgb {
  const a = color.chroma * Math.cos(color.hue);
  const b = color.chroma * Math.sin(color.hue);
  const lRoot = color.lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = color.lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = color.lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot * lRoot * lRoot;
  const m = mRoot * mRoot * mRoot;
  const s = sRoot * sRoot * sRoot;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function inGamut(color: LinearRgb): boolean {
  const tolerance = 1e-7;
  return (
    color.r >= -tolerance &&
    color.r <= 1 + tolerance &&
    color.g >= -tolerance &&
    color.g <= 1 + tolerance &&
    color.b >= -tolerance &&
    color.b <= 1 + tolerance
  );
}

function toSrgb(color: LinearRgb): Rgb {
  const channel = (v: number): number =>
    Math.round(clamp(delinearize(v), 0, 1) * 255);
  return { r: channel(color.r), g: channel(color.g), b: channel(color.b) };
}

function gamutMapToSrgb(source: Oklch): Rgb {
  const linear = fromOklch(source);
  if (inGamut(linear)) return toSrgb(linear);
  const color: Oklch = { ...source };
  let low = 0;
  let high = color.chroma;
  color.chroma = 0;
  let best = fromOklch(color);
  for (let i = 0; i < 20; i++) {
    const candidateChroma = (low + high) / 2;
    color.chroma = candidateChroma;
    const candidate = fromOklch(color);
    if (inGamut(candidate)) {
      low = candidateChroma;
      best = candidate;
    } else {
      high = candidateChroma;
    }
  }
  return toSrgb(best);
}

function relativeLuminance(color: Rgb): number {
  return (
    0.2126 * linearize(color.r) +
    0.7152 * linearize(color.g) +
    0.0722 * linearize(color.b)
  );
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function ensureContrast(
  foreground: Rgb,
  background: Rgb,
  minRatio: number,
  preferLight = 0,
): Rgb {
  if (contrastRatio(foreground, background) >= minRatio) return foreground;
  const source = toOklch(foreground);
  const lighten =
    preferLight > 0
      ? true
      : preferLight < 0
        ? false
        : relativeLuminance(background) < 0.179;
  const endpointAt = (lightness: number): Rgb =>
    gamutMapToSrgb({ lightness, chroma: source.chroma, hue: source.hue });
  const preferred = endpointAt(lighten ? 1 : 0);
  const preferredRatio = contrastRatio(preferred, background);
  if (preferredRatio < minRatio) {
    const opposite = endpointAt(lighten ? 0 : 1);
    return contrastRatio(opposite, background) > preferredRatio
      ? opposite
      : preferred;
  }
  let low = lighten ? source.lightness : 0;
  let high = lighten ? 1 : source.lightness;
  let best = preferred;
  for (let i = 0; i < 20; i++) {
    const lightness = (low + high) / 2;
    const test = gamutMapToSrgb({
      lightness,
      chroma: source.chroma,
      hue: source.hue,
    });
    if (contrastRatio(test, background) >= minRatio) {
      best = test;
      if (lighten) high = lightness;
      else low = lightness;
    } else if (lighten) {
      low = lightness;
    } else {
      high = lightness;
    }
  }
  return best;
}

// ── Resize + quantize ──────────────────────────────────────────────────

/** Box filter resize to 112x112, ported from Noctalia image_loader.cpp. */
export function boxResizeRgba(
  src: Uint8ClampedArray,
  srcW: number,
  srcH: number,
): Uint8Array {
  const dstW = TARGET_SIZE;
  const dstH = TARGET_SIZE;
  const tmp = new Float32Array(srcW * dstH * 4);

  // Vertical pass: uniform box average of whole rows into a float buffer.
  const factorV = dstH / srcH;
  let scaleV = Math.max(1 / factorV + 1e-12, 1);
  let supportV = scaleV * 0.5;
  if (supportV < 0.5) {
    supportV = 0.5;
    scaleV = 1;
  }
  for (let outy = 0; outy < dstH; outy++) {
    const bisect = (outy + 0.5) / factorV + 1e-12;
    const start = Math.trunc(Math.max(bisect - supportV + 0.5, 0));
    const stop = Math.trunc(Math.min(bisect + supportV + 0.5, srcH));
    const count = stop - start;
    if (count <= 0) continue;
    const weight = Math.fround(1 / count);
    for (let x = 0; x < srcW; x++) {
      let t0 = 0;
      let t1 = 0;
      let t2 = 0;
      let t3 = 0;
      for (let i = start; i < stop; i++) {
        const p = (i * srcW + x) * 4;
        t0 = Math.fround(t0 + Math.fround((src[p] ?? 0) * weight));
        t1 = Math.fround(t1 + Math.fround((src[p + 1] ?? 0) * weight));
        t2 = Math.fround(t2 + Math.fround((src[p + 2] ?? 0) * weight));
        t3 = Math.fround(t3 + Math.fround((src[p + 3] ?? 0) * weight));
      }
      const d = (outy * srcW + x) * 4;
      tmp[d] = t0;
      tmp[d + 1] = t1;
      tmp[d + 2] = t2;
      tmp[d + 3] = t3;
    }
  }

  // Horizontal pass: uniform box average of whole columns, clamp + round.
  const out = new Uint8Array(dstW * dstH * 4);
  const factorH = dstW / srcW;
  let scaleH = Math.max(1 / factorH + 1e-12, 1);
  let supportH = scaleH * 0.5;
  if (supportH < 0.5) {
    supportH = 0.5;
    scaleH = 1;
  }
  const toByte = (value: number): number =>
    Math.floor(Math.fround(Math.min(Math.max(value, 0), 255) + 0.5));
  for (let outx = 0; outx < dstW; outx++) {
    const bisect = (outx + 0.5) / factorH + 1e-12;
    const start = Math.trunc(Math.max(bisect - supportH + 0.5, 0));
    const stop = Math.trunc(Math.min(bisect + supportH + 0.5, srcW));
    const count = stop - start;
    if (count <= 0) continue;
    const weight = Math.fround(1 / count);
    for (let y = 0; y < dstH; y++) {
      let t0 = 0;
      let t1 = 0;
      let t2 = 0;
      let t3 = 0;
      for (let i = start; i < stop; i++) {
        const p = (y * srcW + i) * 4;
        t0 = Math.fround(t0 + Math.fround((tmp[p] ?? 0) * weight));
        t1 = Math.fround(t1 + Math.fround((tmp[p + 1] ?? 0) * weight));
        t2 = Math.fround(t2 + Math.fround((tmp[p + 2] ?? 0) * weight));
        t3 = Math.fround(t3 + Math.fround((tmp[p + 3] ?? 0) * weight));
      }
      const d = (y * dstW + outx) * 4;
      out[d] = toByte(t0);
      out[d + 1] = toByte(t1);
      out[d + 2] = toByte(t2);
      out[d + 3] = toByte(t3);
    }
  }

  return out;
}

function downsamplePixels(rgba: Uint8Array): Rgb[] {
  const pixels: Rgb[] = [];
  const total = TARGET_SIZE * TARGET_SIZE;
  for (let i = 0; i < total; i += 16) {
    const p = i * 4;
    pixels.push({
      r: rgba[p] ?? 0,
      g: rgba[p + 1] ?? 0,
      b: rgba[p + 2] ?? 0,
    });
  }
  return pixels;
}

function hctOf(color: Rgb): Hct {
  return Hct.fromInt(toArgb(color));
}

function kmeansCluster(colors: Rgb[], k: number): Cluster[] {
  const n = colors.length;
  if (n === 0) return [];
  const effectiveK = Math.min(k, n);
  const labs = colors.map(rgbToLab);
  const sorted = labs.map((_, index) => index);
  sorted.sort((a, b) => (labs[a]?.l ?? 0) - (labs[b]?.l ?? 0));
  const step = Math.floor(n / effectiveK);
  const centroids: Lab[] = [];
  for (let i = 0; i < effectiveK; i++) {
    const index = sorted[i * step] ?? 0;
    centroids.push(labs[index] ?? { l: 0, a: 0, b: 0 });
  }
  const assignments = new Array<number>(n).fill(0);
  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    let moved = 0;
    for (let idx = 0; idx < n; idx++) {
      const point = labs[idx] ?? { l: 0, a: 0, b: 0 };
      let best = Number.POSITIVE_INFINITY;
      let bestIndex = 0;
      for (let ci = 0; ci < effectiveK; ci++) {
        const d = labDistance(point, centroids[ci] ?? point);
        if (d < best) {
          best = d;
          bestIndex = ci;
        }
      }
      if (assignments[idx] !== bestIndex) {
        assignments[idx] = bestIndex;
        moved++;
      }
    }
    const acc = Array.from({ length: effectiveK }, () => ({
      l: 0,
      a: 0,
      b: 0,
    }));
    const counts = new Array<number>(effectiveK).fill(0);
    for (let idx = 0; idx < n; idx++) {
      const ci = assignments[idx] ?? 0;
      const point = labs[idx] ?? { l: 0, a: 0, b: 0 };
      const bucket = acc[ci] ?? { l: 0, a: 0, b: 0 };
      bucket.l += point.l;
      bucket.a += point.a;
      bucket.b += point.b;
      counts[ci] = (counts[ci] ?? 0) + 1;
    }
    for (let ci = 0; ci < effectiveK; ci++) {
      const count = counts[ci] ?? 0;
      if (count > 0) {
        const bucket = acc[ci] ?? { l: 0, a: 0, b: 0 };
        centroids[ci] = {
          l: bucket.l / count,
          a: bucket.a / count,
          b: bucket.b / count,
        };
      }
    }
    if (iter > 0 && moved === 0) break;
  }

  const clusterCounts = new Array<number>(effectiveK).fill(0);
  for (let idx = 0; idx < n; idx++) {
    const ci = assignments[idx] ?? 0;
    clusterCounts[ci] = (clusterCounts[ci] ?? 0) + 1;
  }
  const clusters: Cluster[] = [];
  for (let ci = 0; ci < effectiveK; ci++) {
    const count = clusterCounts[ci] ?? 0;
    if (count === 0) continue;
    clusters.push({
      centroid: labToRgb(centroids[ci] ?? { l: 0, a: 0, b: 0 }),
      count,
    });
  }
  clusters.sort((a, b) => b.count - a.count);
  return clusters;
}

function scoreChroma(input: Cluster[]): Scored[] {
  const scored: Scored[] = [];
  for (const cluster of input) {
    const hct = hctOf(cluster.centroid);
    let tonePenalty = 0;
    if (hct.tone < 20) tonePenalty = (20 - hct.tone) * 2;
    else if (hct.tone > 80) tonePenalty = (hct.tone - 80) * 1.5;
    else if (hct.tone < 40) tonePenalty = (40 - hct.tone) * 0.5;
    else if (hct.tone > 60) tonePenalty = (hct.tone - 60) * 0.3;
    let huePenalty = 0;
    if (hct.hue > 80 && hct.hue < 110) huePenalty = 5;
    scored.push({
      color: cluster.centroid,
      score:
        (hct.chroma - tonePenalty - huePenalty) * Math.pow(cluster.count, 0.3),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function extractPalette(rgba: Uint8Array): Rgb[] {
  const sampled = downsamplePixels(rgba);
  const kept = sampled.filter((color) => hctOf(color).chroma >= MIN_CHROMA);
  const filtered = kept.length >= CLUSTER_COUNT * 2 ? kept : sampled;
  const scored = scoreChroma(kmeansCluster(filtered, CLUSTER_COUNT));
  const colors = scored.map((entry) => entry.color);
  while (colors.length < 5) {
    const base = colors[0];
    if (base === undefined) {
      colors.push({ r: 103, g: 80, b: 164 });
    } else {
      colors.push(shiftHue(base, colors.length * 60));
    }
  }
  return colors.slice(0, 5);
}

function findErrorColor(palette: Rgb[]): Rgb {
  for (const color of palette) {
    const hsl = toHsl(color);
    if (
      (hsl.h <= 30 || hsl.h >= 330) &&
      hsl.s > 0.4 &&
      hsl.l > 0.3 &&
      hsl.l < 0.7
    ) {
      return color;
    }
  }
  return { r: 0xfd, g: 0x46, b: 0x63 };
}

function containerDark(base: Rgb): Rgb {
  const hsl = toHsl(base);
  return fromHsl(
    hsl.h,
    hsl.s + 0.15 * (1 - hsl.s),
    Math.max(hsl.l - 0.35, 0.15),
  );
}

function containerLight(base: Rgb): Rgb {
  const hsl = toHsl(base);
  return fromHsl(
    hsl.h,
    Math.max(hsl.s - 0.2, 0.3),
    Math.min(hsl.l + 0.35, 0.85),
  );
}

type Accents = [Rgb, Rgb, Rgb, Rgb];

function accents(palette: Rgb[], lighter: boolean): Accents {
  const primary = palette[0] ?? { r: 255, g: 245, b: 155 };
  const primaryHsl = toHsl(primary);
  let secondary = shiftHue(primary, 30);
  const second = palette[1];
  if (second !== undefined && hueDistance(primaryHsl.h, toHsl(second).h) > 30) {
    secondary = second;
  }
  let tertiary = shiftHue(primary, 60);
  const third = palette[2];
  if (third !== undefined) {
    const thirdHsl = toHsl(third);
    const secondaryHsl = toHsl(secondary);
    if (
      hueDistance(primaryHsl.h, thirdHsl.h) > 30 &&
      hueDistance(secondaryHsl.h, thirdHsl.h) > 30
    ) {
      tertiary = third;
    }
  }
  const primaryAdjusted = lighter
    ? fromHsl(
        primaryHsl.h,
        Math.max(primaryHsl.s, 0.7),
        clamp(primaryHsl.l, 0.25, 0.45),
      )
    : fromHsl(
        primaryHsl.h,
        Math.max(primaryHsl.s, 0.7),
        Math.max(primaryHsl.l, 0.65),
      );
  const secondaryHsl = toHsl(secondary);
  const secondaryAdjusted = lighter
    ? fromHsl(
        secondaryHsl.h,
        Math.max(secondaryHsl.s, 0.6),
        clamp(secondaryHsl.l, 0.22, 0.4),
      )
    : fromHsl(
        secondaryHsl.h,
        Math.max(secondaryHsl.s, 0.6),
        Math.max(secondaryHsl.l, 0.6),
      );
  const tertiaryHsl = toHsl(tertiary);
  const tertiaryAdjusted = lighter
    ? fromHsl(
        tertiaryHsl.h,
        Math.max(tertiaryHsl.s, 0.5),
        clamp(tertiaryHsl.l, 0.2, 0.35),
      )
    : fromHsl(
        tertiaryHsl.h,
        Math.max(tertiaryHsl.s, 0.5),
        Math.max(tertiaryHsl.l, 0.6),
      );
  return [primary, primaryAdjusted, secondaryAdjusted, tertiaryAdjusted];
}

function darkTokens(palette: Rgb[]): Record<string, string> {
  const [primary, primaryAdjusted, secondaryAdjusted, tertiaryAdjusted] =
    accents(palette, false);
  const primaryHsl = toHsl(primary ?? { r: 0, g: 0, b: 0 });
  const surfaceHue = (() => {
    let hue = primaryHsl.h;
    if (hue >= 160 && hue <= 200) hue = (hue + 10) % 360;
    return hue;
  })();
  const satCap =
    surfaceHue < 60 || surfaceHue > 300 ? 0.35 : surfaceHue < 120 ? 0.5 : 0.9;
  const baseSurface = fromHsl(
    surfaceHue,
    Math.min(toHsl(primary ?? { r: 0, g: 0, b: 0 }).s, satCap),
    0.5,
  );
  const surface = adjustSurface(baseSurface, satCap, 0.12);
  const surfaceVariant = adjustSurface(
    baseSurface,
    Math.min(0.8, satCap),
    0.16,
  );
  const surfaceContainerLow = adjustSurface(baseSurface, 0.85, 0.14);
  const textHue = primaryHsl.h;
  const onSurface = ensureContrast(fromHsl(textHue, 0.05, 0.95), surface, 4.5);
  const onSurfaceVariant = ensureContrast(
    fromHsl(textHue, 0.05, 0.7),
    surfaceVariant,
    4.5,
  );
  const error = findErrorColor(palette);
  return {
    background: toHex(surface),
    primary: toHex(primaryAdjusted),
    secondary: toHex(secondaryAdjusted),
    tertiary: toHex(tertiaryAdjusted),
    onSurface: toHex(onSurface),
    onSurfaceVariant: toHex(onSurfaceVariant),
    surfaceContainerLow: toHex(surfaceContainerLow),
    error: toHex(error),
    errorContainer: toHex(containerDark(error)),
  };
}

function lightTokens(palette: Rgb[]): Record<string, string> {
  const [primary, primaryAdjusted, secondaryAdjusted, tertiaryAdjusted] =
    accents(palette, true);
  const textHue = toHsl(primary ?? { r: 0, g: 0, b: 0 }).h;
  const base = primary ?? { r: 0, g: 0, b: 0 };
  const surface = adjustSurface(base, 0.9, 0.9);
  const surfaceVariant = adjustSurface(base, 0.8, 0.78);
  const surfaceContainerLow = adjustSurface(base, 0.85, 0.88);
  const onSurface = ensureContrast(fromHsl(textHue, 0.05, 0.1), surface, 4.5);
  const onSurfaceVariant = ensureContrast(
    fromHsl(textHue, 0.05, 0.35),
    surfaceVariant,
    4.5,
  );
  const error = findErrorColor(palette);
  return {
    background: toHex(surface),
    primary: toHex(primaryAdjusted),
    secondary: toHex(secondaryAdjusted),
    tertiary: toHex(tertiaryAdjusted),
    onSurface: toHex(onSurface),
    onSurfaceVariant: toHex(onSurfaceVariant),
    surfaceContainerLow: toHex(surfaceContainerLow),
    error: toHex(error),
    errorContainer: toHex(containerLight(error)),
  };
}

export type NoctaliaVibrantPalette = {
  background: string;
  primary: string;
  secondary: string;
  tertiary: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  error: string;
  errorContainer: string;
};

export function generateNoctaliaVibrantFromResized(
  rgba112: Uint8Array,
  mode: "dark" | "light",
): NoctaliaVibrantPalette {
  const palette = extractPalette(rgba112);
  const tokens = mode === "dark" ? darkTokens(palette) : lightTokens(palette);
  return {
    background: tokens["background"] ?? "#000000",
    primary: tokens["primary"] ?? FALLBACK,
    secondary: tokens["secondary"] ?? FALLBACK,
    tertiary: tokens["tertiary"] ?? FALLBACK,
    onSurface: tokens["onSurface"] ?? "#ffffff",
    onSurfaceVariant: tokens["onSurfaceVariant"] ?? "#cccccc",
    surfaceContainerLow: tokens["surfaceContainerLow"] ?? "#111111",
    error: tokens["error"] ?? FALLBACK_ERROR,
    errorContainer: tokens["errorContainer"] ?? FALLBACK_ERROR,
  };
}

export function generateNoctaliaVibrant(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  mode: "dark" | "light",
): NoctaliaVibrantPalette {
  const resized = boxResizeRgba(rgba, width, height);
  return generateNoctaliaVibrantFromResized(resized, mode);
}
