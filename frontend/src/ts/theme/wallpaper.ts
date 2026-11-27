/**
 * Wallpaper theme: generates Monkeytype palettes from the background image
 * shown behind the page and keeps them in sync.
 *
 * The generated colors are written into `customThemeColors` (a wallpaper
 * theme is a custom theme with generated colors), so the applied theme stays
 * derived state exactly like the manual custom theme editor.
 */
import type {
  CustomThemeColors,
  WallpaperThemeMode,
  WallpaperThemeVariant,
} from "@monkeytype/schemas/configs";
import { createEffect, createSignal } from "solid-js";

import { setConfig } from "../config/setters";
import { getConfig } from "../config/store";
import { createEffectOn } from "../hooks/effects";
import FileStorage from "../utils/file-storage";
import {
  generateAllWallpaperSchemes,
  type GeneratedScheme,
} from "../utils/wallpaper-theme";

const [wallpaperSchemes, setWallpaperSchemes] = createSignal<GeneratedScheme[]>(
  [],
);
const [wallpaperLoading, setWallpaperLoading] = createSignal(false);
const [wallpaperError, setWallpaperError] = createSignal<string | null>(null);
const [wallpaperSourceLabel, setWallpaperSourceLabel] = createSignal("");
const [wallpaperLastSrc, setWallpaperLastSrc] = createSignal<string | null>(
  null,
);

type WallpaperSourceKind = "custom-background" | "upload";

let wallpaperGeneration = 0;
let lastGenerationMode: WallpaperThemeMode | null = null;
// HTTP validators of the background, so the periodic check can notice a changed
// image with a HEAD request instead of downloading it again
let lastValidators: string | null = null;
// what the current palettes were generated from: an uploaded image is a
// one-off override, so the background sync must not replace it
let lastSourceKind: WallpaperSourceKind | null = null;
// the background the palettes belong to, to skip regenerating on every
// settings visit without ignoring an actually changed background
let lastBackgroundSrc = "";
let initialized = false;

export {
  wallpaperError,
  wallpaperLastSrc,
  wallpaperLoading,
  wallpaperSchemes,
  wallpaperSourceLabel,
};

async function resolveWallpaperImageSrc(): Promise<string | null> {
  const local = await FileStorage.getFile("LocalBackgroundFile");
  if (typeof local === "string" && local.length > 0) {
    return local;
  }
  const bg = getConfig.customBackground;
  // the background url is validated as an http(s) image url by the schema;
  // local images are stored separately and handled above
  if (bg.startsWith("http://") || bg.startsWith("https://")) {
    return bg;
  }
  return null;
}

function applySchemeForCurrentVariant(schemes: GeneratedScheme[]): void {
  const selected =
    schemes.find((s) => s.id === getConfig.wallpaperThemeVariant) ?? schemes[0];
  if (selected !== undefined) {
    setConfig("customThemeColors", [...selected.colors] as CustomThemeColors);
  }
}

/**
 * Regenerates the palette from the current background (a local upload takes
 * priority over the configured url) and applies it when wallpaper mode is on.
 */
export async function generateWallpaperThemes(
  source: "custom-background" | File,
  force = false,
): Promise<void> {
  const generation = ++wallpaperGeneration;
  setWallpaperLoading(true);
  setWallpaperError(null);
  try {
    let src: string;
    let validators: Promise<string | null> = Promise.resolve(null);
    if (source === "custom-background") {
      const resolved = await resolveWallpaperImageSrc();
      if (resolved === null) {
        setWallpaperError(
          "No custom background image found. Set a background in the custom background section first, or upload an image here.",
        );
        setWallpaperSchemes([]);
        setWallpaperLastSrc(null);
        setWallpaperSourceLabel("");
        return;
      }
      src = resolved;
      if (
        !force &&
        lastSourceKind === "custom-background" &&
        src === lastBackgroundSrc &&
        getConfig.wallpaperThemeMode === lastGenerationMode &&
        wallpaperSchemes().length > 0
      ) {
        // already generated from this exact image, but the colors may not be
        // applied yet (eg. wallpaper mode just got enabled)
        lastSourceKind = "custom-background";
        if (getConfig.wallpaperTheme) {
          applySchemeForCurrentVariant(wallpaperSchemes());
        }
        return;
      }
      if (src !== lastBackgroundSrc) {
        lastValidators = null;
      }
      lastBackgroundSrc = src;
      validators = backgroundValidators(src);
      setWallpaperSourceLabel("custom background");
    } else {
      src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (): void => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Could not read image"));
        };
        reader.onerror = (): void => reject(new Error("Could not read image"));
        reader.readAsDataURL(source);
      });
      setWallpaperSourceLabel(source.name);
    }

    const schemes = await generateAllWallpaperSchemes(
      src,
      getConfig.wallpaperThemeMode,
    );
    if (generation !== wallpaperGeneration) return;
    setWallpaperSchemes(schemes);
    setWallpaperLastSrc(src);
    lastSourceKind =
      source === "custom-background" ? "custom-background" : "upload";
    lastGenerationMode = getConfig.wallpaperThemeMode;
    // remember the state of the image we just used, so the next check compares
    // against it instead of treating the first look as a change
    if (source === "custom-background") {
      void validators.then((value) => {
        if (generation === wallpaperGeneration) lastValidators = value;
      });
    }

    if (getConfig.wallpaperTheme) {
      applySchemeForCurrentVariant(schemes);
    }
  } catch (e) {
    if (generation !== wallpaperGeneration) return;
    const message =
      e instanceof Error ? e.message : "Failed to generate colors from image";
    setWallpaperError(message);
    setWallpaperSchemes([]);
    setWallpaperSourceLabel("");
  } finally {
    if (generation === wallpaperGeneration) {
      setWallpaperLoading(false);
    }
  }
}

/** Re-runs the palette generation for the image used last (e.g. after a tone change). */
export async function regenerateFromLastSource(): Promise<void> {
  const src = wallpaperLastSrc();
  if (src === null) return;
  const generation = ++wallpaperGeneration;
  setWallpaperLoading(true);
  setWallpaperError(null);
  try {
    const schemes = await generateAllWallpaperSchemes(
      src,
      getConfig.wallpaperThemeMode,
    );
    if (generation !== wallpaperGeneration) return;
    setWallpaperSchemes(schemes);
    lastGenerationMode = getConfig.wallpaperThemeMode;
    if (getConfig.wallpaperTheme) {
      applySchemeForCurrentVariant(schemes);
    }
  } catch (e) {
    if (generation !== wallpaperGeneration) return;
    const message =
      e instanceof Error ? e.message : "Failed to regenerate colors";
    setWallpaperError(message);
  } finally {
    if (generation === wallpaperGeneration) {
      setWallpaperLoading(false);
    }
  }
}

export function applyWallpaperVariant(scheme: GeneratedScheme): void {
  setConfig("wallpaperThemeVariant", scheme.id);
  if (getConfig.wallpaperTheme) {
    setConfig("customThemeColors", [...scheme.colors] as CustomThemeColors);
  }
}

/**
 * Makes sure the schemes belong to the current background. Palettes generated
 * from an upload are kept as they are.
 */
async function ensureSchemes(): Promise<void> {
  if (lastSourceKind === "upload" && wallpaperSchemes().length > 0) return;
  await generateWallpaperThemes("custom-background");
}

/**
 * Applies a wallpaper variant immediately (from the commandline), generating the
 * schemes first when they are not ready yet. Picking a variant turns wallpaper
 * mode on.
 */
export async function selectWallpaperVariant(
  variant: WallpaperThemeVariant,
): Promise<void> {
  setConfig("wallpaperTheme", true);
  setConfig("wallpaperThemeVariant", variant);

  await ensureSchemes();

  const scheme = wallpaperSchemes().find((s) => s.id === variant);
  if (scheme !== undefined) {
    setConfig("customThemeColors", [...scheme.colors] as CustomThemeColors);
  }
}

/**
 * Switches the palette between the dark and light tone of the current wallpaper.
 * The colors depend on the tone, so the schemes are regenerated from the image
 * used last (falling back to the configured background).
 */
export async function selectWallpaperMode(
  mode: WallpaperThemeMode,
): Promise<void> {
  setConfig("wallpaperTheme", true);
  setConfig("wallpaperThemeMode", mode);

  // an upload keeps its own image, otherwise re-read the configured background
  if (lastSourceKind === "upload" && wallpaperLastSrc() !== null) {
    await regenerateFromLastSource();
    return;
  }

  await generateWallpaperThemes("custom-background");
}

/**
 * Asks the server whether the background changed, using its ETag, Last-Modified
 * or length. Servers without validators are not polled: downloading the whole
 * image every minute just to notice a change is too expensive.
 */
async function backgroundValidators(src: string): Promise<string | null> {
  if (src.startsWith("data:")) return null;
  try {
    const response = await fetch(src, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const values = ["etag", "last-modified", "content-length"].map((header) =>
      response.headers.get(header),
    );
    return values.every((value) => value === null) ? null : values.join("|");
  } catch {
    return null;
  }
}

/**
 * The background url can stay the same while the image behind it changes (e.g.
 * a "current desktop wallpaper" endpoint), so re-check on focus and periodically
 * instead of relying only on config changes.
 */
async function checkForWallpaperChange(): Promise<void> {
  if (!getConfig.wallpaperTheme || wallpaperLoading()) return;
  // uploaded palettes are not tied to the configured background
  if (lastSourceKind !== "custom-background") return;
  const src = await resolveWallpaperImageSrc();
  if (src === null) return;
  const validators = await backgroundValidators(src);
  if (validators === null) return;
  if (lastValidators === null) {
    // the generation could not read validators (eg. a transient HEAD failure);
    // refresh once instead of silently ignoring a change
    lastValidators = validators;
    await generateWallpaperThemes("custom-background", true);
    return;
  }
  if (validators === lastValidators) return;
  lastValidators = validators;
  await generateWallpaperThemes("custom-background", true);
}

/**
 * Watches the background shown behind the page and keeps the wallpaper palette
 * in sync, no matter which settings page is open.
 */
export function initWallpaperTheme(): void {
  if (initialized) return;
  initialized = true;

  // a fresh object on every storage change, so removing a local background
  // regenerates from the url even when the value was already undefined
  const [localBackground, setLocalBackground] = createSignal<{
    src: string | undefined;
  } | null>(null);
  createEffect(() => {
    FileStorage.track("LocalBackgroundFile");
    void FileStorage.getFile("LocalBackgroundFile")
      .then((file) => {
        setLocalBackground({ src: file });
      })
      .catch(() => {
        setLocalBackground({ src: undefined });
      });
  });

  createEffectOn(
    () =>
      [
        getConfig.wallpaperTheme,
        getConfig.customBackground,
        localBackground(),
      ] as const,
    ([enabled, url, local]) => {
      if (!enabled || local === null) return;
      // a wallpaper theme is a custom theme with generated colors - enabling
      // it from any entry point has to switch the custom theme on as well
      if (!getConfig.customTheme) {
        setConfig("customTheme", true);
      }
      const background = local.src ?? url;
      if (background === "") return;
      // keep the palettes of an uploaded image when only re-entering the panel,
      // but follow the background when it actually changed. re-apply the saved
      // variant: the custom editor may have changed the colors in the meantime
      if (background === lastBackgroundSrc && wallpaperSchemes().length > 0) {
        if (getConfig.wallpaperTheme) {
          applySchemeForCurrentVariant(wallpaperSchemes());
        }
        return;
      }
      if (background !== lastBackgroundSrc) {
        lastValidators = null;
      }
      lastBackgroundSrc = background;
      void generateWallpaperThemes("custom-background");
    },
  );

  const check = (): void => {
    void checkForWallpaperChange();
  };
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) check();
  });
  setInterval(() => {
    if (!document.hidden) check();
  }, 60_000);
}
