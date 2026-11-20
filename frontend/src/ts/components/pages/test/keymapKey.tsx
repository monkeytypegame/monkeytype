import { createEffect, createMemo, createSignal, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { showCommandline } from "../../../states/commandline";
import {
  FlashEntry,
  getKeymapHighlightKey,
  getKeymapLayout,
  setKeymapFlashState,
} from "../../../states/test";
import { getTheme } from "../../../states/theme";
import { Button } from "../../common/Button";
import { KeyDefinition } from "./keymapLayouts";

export const symbolsPattern = /^[^\p{L}\p{N}]{1}$/u;

/**
 * The legend to display on a key for the given legend layer.
 * Shared by the 2d and 3d keymap renderers.
 */
export function keyLabel(
  key: KeyDefinition,
  layer: { index: number; symbolIndex?: number },
): string {
  let label = key.legends[layer.index];

  if (layer.symbolIndex !== undefined) {
    const keyIsSymbol = [
      key.legends[layer.index],
      key.legends[layer.symbolIndex],
    ].some((character) => symbolsPattern.test(character ?? ""));

    if (keyIsSymbol) {
      label = key.legends[layer.symbolIndex];
    }
  }

  return label ?? "";
}

/**
 * The per-key flash/next/fade visual state, shared by the 2d and 3d keymap
 * renderers. Call from a component body: the state is per-key reactive.
 */
export function createKeyVisualState(
  props: {
    label: string;
    flashEntry: () => FlashEntry | undefined;
  } & KeyDefinition,
) {
  const isSteno = () =>
    getConfig.keymapStyle === "steno" ||
    getConfig.keymapStyle === "steno_matrix";

  // Steno keys never flash.
  const flashInfo = createMemo(() => {
    if (isSteno() || getConfig.keymapMode !== "react") {
      return { tick: 0, correct: true };
    }

    const entry = props.flashEntry();
    return {
      tick: entry?.tick ?? 0,
      correct: getConfig.blindMode || (entry?.correct ?? true),
    };
  });

  const isNext = createMemo(
    () =>
      getConfig.keymapMode === "next" &&
      !isSteno() &&
      props.legends?.some((legend) => legend === getKeymapHighlightKey()),
  );

  const keyMatchesHighlight = createMemo(() =>
    props.legends?.some((legend) => legend === getKeymapHighlightKey()),
  );

  // Fade when leaving "next" mode
  const [isFading, setIsFading] = createSignal(false);
  let prevKeymapMode = getConfig.keymapMode;
  let prevKeyWasHighlighted = false;
  createEffect(() => {
    const mode = getConfig.keymapMode;
    const isStenoMode = isSteno();
    const keyWasHighlighted = keyMatchesHighlight() && !isStenoMode;

    if (prevKeymapMode === "next" && mode !== "next" && prevKeyWasHighlighted) {
      setIsFading(true);
    }
    prevKeymapMode = mode;
    prevKeyWasHighlighted = keyWasHighlighted;
  });

  const baseKeyBgColor = () => {
    if (isFading()) {
      return getTheme().main;
    }
    return isNext() ? getTheme().main : getTheme().subAlt;
  };

  const baseKeyColor = () => {
    if (isFading()) {
      return getTheme().bg;
    }
    return isNext() ? getTheme().bg : getTheme().sub;
  };

  // Don't apply reduced motion. If the user activates react/next they want animations.
  const animKeyBgColor = createMemo(() => {
    if (isFading()) {
      return [getTheme().main, getTheme().subAlt];
    }
    if (flashInfo().tick === 0) {
      return [isNext() ? getTheme().main : getTheme().subAlt];
    }
    return [
      flashInfo().correct ? getTheme().main : getTheme().error,
      isNext() ? getTheme().main : getTheme().subAlt,
    ];
  });

  const animKeyColor = createMemo(() => {
    if (isFading()) {
      return [getTheme().bg, getTheme().sub];
    }
    if (flashInfo().tick === 0) {
      return [isNext() ? getTheme().bg : getTheme().sub];
    }
    return [getTheme().bg, isNext() ? getTheme().bg : getTheme().sub];
  });

  // Don't apply reduced motion. If the user activates react/next they want animations.
  const animDuration = createMemo(() => {
    if (isFading()) return 250;
    if (flashInfo().tick === 0) return 0;
    return 250;
  });

  return {
    isSteno,
    flashInfo,
    isNext,
    isFading,
    baseKeyBgColor,
    baseKeyColor,
    animKeyBgColor,
    animKeyColor,
    animDuration,
    resetFlash: () => {
      props.legends.forEach((l) => setKeymapFlashState(l, undefined));
      if (isFading()) {
        setIsFading(false);
      }
    },
  };
}

export type KeyVisualState = ReturnType<typeof createKeyVisualState>;

/**
 * The key content (legend, homing dot or the layout-indicator button) shared
 * by the 2d and 3d keymap renderers.
 */
export function KeyContent(
  props: { visual: KeyVisualState } & { label: string } & KeyDefinition,
) {
  return (
    <Show
      when={props.isLayoutIndicator && getConfig.keymapLegendStyle !== "blank"}
      fallback={
        <>
          {props.label}
          <Show when={props.isHoming}>
            <div class="absolute bottom-0.75 left-auto h-0.5 w-2 rounded bg-bg"></div>
          </Show>
        </>
      }
    >
      <Button
        variant="text"
        class="text-[0.5em] [--themable-button-bg:transparent] [--themable-button-text:var(--keycolor)]"
        text={getKeymapLayout().layoutNameDisplayString}
        onClick={() => showCommandline({ subgroupOverride: "keymapLayout" })}
        tabIndex={-1}
      />
    </Show>
  );
}
