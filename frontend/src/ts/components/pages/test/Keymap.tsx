import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { showCommandLineForConfig } from "../../../states/core";
import { getModifierState, isCapsLockOn } from "../../../states/modifiers";
import {
  FlashEntry,
  getKeymapFlashState,
  getKeymapHighlightKey,
  getKeymapLayout,
  keymapLayoutObject,
  setKeymapFlashState,
  wordsHaveNumbers,
} from "../../../states/test";
import { getTheme } from "../../../states/theme";
import { cn } from "../../../utils/cn";
import { applyReducedMotion, isMacLike } from "../../../utils/misc";
import { Anime } from "../../common/anime";
import { Button } from "../../common/Button";
import { convertLayoutToKeymap } from "./keymapConverter";
import { KeyboardDefinition, KeyDefinition } from "./keymapLayouts";

export function Keymap() {
  return (
    <Show when={keymapLayoutObject()}>
      <Keyboard
        displayName={getKeymapLayout().layoutNameDisplayString}
        layoutData={keymapLayoutObject() as LayoutObject}
      />
    </Show>
  );
}

function Keyboard(props: { displayName: string; layoutData: LayoutObject }) {
  const layer = createMemo(() => {
    const { alt, shift } = getModifierState();
    switch (getConfig.keymapLegendStyle) {
      case "blank":
        return -1;
      case "lowercase":
        return 0;
      case "uppercase":
        return 1;
      case "dynamic": {
        if (shift && alt) {
          return 3;
        } else if (alt) {
          return 2;
        } else if (shift || isCapsLockOn()) {
          return 1;
        }
        return 0;
      }
      default:
        return 0;
    }
  });

  const showFirstRow = createMemo(
    () =>
      (wordsHaveNumbers() && getConfig.keymapMode === "next") ||
      getConfig.keymapLayoutStyle === "full" ||
      getConfig.keymapLayoutStyle === "minimal_numrow" ||
      (getConfig.keymapLayoutStyle === "minimal_layout" &&
        props.layoutData.keymapShowTopRow),
  );

  const keyboardDef = createMemo(() =>
    convertLayoutToKeymap(props.layoutData, {
      keymapStyle: getConfig.keymapStyle,
      showAllKeys:
        getConfig.keymapLayoutStyle === "full" ||
        props.layoutData.matrixShowRightColumn === true,
    }),
  );

  return (
    <div
      data-ui-element="keymap"
      class="flex w-full flex-col items-center py-8 text-sm text-sub"
      style={{
        zoom: getConfig.keymapSize,
      }}
    >
      <Show when={keyboardDef()} fallback={<div>Loading...</div>}>
        <KeyboardDefinitionRenderer
          keyboardDef={keyboardDef()}
          layer={layer()}
          showFirstRow={showFirstRow()}
          flashState={getKeymapFlashState}
        />
      </Show>
    </div>
  );
}

function KeyboardDefinitionRenderer(props: {
  keyboardDef: KeyboardDefinition;
  layer: number;
  showFirstRow: boolean;
  flashState: Record<string, FlashEntry | undefined>;
}) {
  return (
    <div class="w-fit">
      <For each={props.keyboardDef}>
        {(keys, rowNum) => (
          <Show when={rowNum() !== 0 || props.showFirstRow}>
            <div class="flex h-8 flex-row">
              <For each={keys}>
                {(key) => {
                  const label = () => {
                    const layer =
                      rowNum() === 0 && isMacLike() && isCapsLockOn()
                        ? props.layer - 1
                        : props.layer;
                    return key.legends[layer] ?? "";
                  };
                  const flashEntry = () =>
                    key.legends
                      .map((legend) => props.flashState[legend])
                      .find((it) => it !== undefined);
                  return (
                    <Key {...key} label={label()} flashEntry={flashEntry} />
                  );
                }}
              </For>
            </div>
          </Show>
        )}
      </For>
    </div>
  );
}

function Key(
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
    return { tick: entry?.tick ?? 0, correct: entry?.correct ?? true };
  });

  const isNext = createMemo(
    () =>
      getConfig.keymapMode === "next" &&
      !isSteno() &&
      props.legends?.some((legend) => legend === getKeymapHighlightKey()),
  );

  const fadeDuration = applyReducedMotion(250);

  const keyMatchesHighlight = createMemo(() =>
    props.legends?.some((legend) => legend === getKeymapHighlightKey()),
  );

  // Fade when leaving "next" mode
  const [isFading, setIsFading] = createSignal(false);
  let prevKeymapMode = getConfig.keymapMode;
  let prevKeyWasHighlighted = false;
  createEffect((onCleanup: unknown) => {
    const mode = getConfig.keymapMode;
    const isStenoMode = isSteno();
    const keyWasHighlighted = keyMatchesHighlight() && !isStenoMode;

    if (prevKeymapMode === "next" && mode !== "next" && prevKeyWasHighlighted) {
      setIsFading(true);
      const id = setTimeout(() => setIsFading(false), fadeDuration);
      (onCleanup as (fn: () => void) => void)(() => clearTimeout(id));
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

  const animDuration = createMemo(() => {
    if (isFading()) return fadeDuration;
    if (flashInfo().tick === 0) return 0;
    return fadeDuration;
  });

  return (
    <Anime
      class={cn(
        "relative flex justify-center rounded border-2 border-bg bg-sub-alt",
        (props.label ?? "").length >= 2 && "text-em-xs",
        {
          "items-center": props.align !== "top",
          "items-start pt-1.5": props.align === "top",
        },
      )}
      style={{
        "--keybgcolor": baseKeyBgColor(),
        "--keycolor": baseKeyColor(),
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
        "margin-top": `${(props.y ?? 0) * 2}rem`,
        transform:
          props.rotation !== undefined ? `rotate(${props.rotation}deg)` : "",
        "background-color": "var(--keybgcolor)",
        color: "var(--keycolor)",
      }}
      animation={{
        "--keybgcolor": animKeyBgColor(),
        "--keycolor": animKeyColor(),
        duration: animDuration(),
        onComplete: () =>
          props.legends.forEach((l) => setKeymapFlashState(l, undefined)),
      }}
    >
      <Show
        when={props.isLayoutIndicator}
        fallback={
          <>
            {props.label}
            <Show when={props.isHoming}>
              <div
                class={cn(
                  "bg-em-xs absolute bottom-0.75 left-auto h-0.5 w-2 rounded bg-bg",
                )}
              ></div>
            </Show>
          </>
        }
      >
        <Button
          variant="text"
          class="text-[0.5em] [--themable-button-bg:transparent] [--themable-button-text:var(--keycolor)]"
          text={getKeymapLayout().layoutNameDisplayString}
          onClick={() => showCommandLineForConfig("keymapLayout")}
          tabIndex={-1}
        />
      </Show>
    </Anime>
  );
}
