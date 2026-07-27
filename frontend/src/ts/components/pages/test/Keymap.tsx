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

const symbolsPattern = /^[^\p{L}\p{N}]{1}$/u;

export function Keymap() {
  return (
    <Show when={getConfig.keymapMode !== "off" && keymapLayoutObject()}>
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

    // MacOS has different CapsLock and Shift logic than other operating systems
    // Windows and Linux only capitalize letters if either Shift OR CapsLock are
    // pressed, but not both at once.
    // MacOS instead capitalizes when either or both are pressed,
    // so we have to check for that.
    const isShifted = isMacLike()
      ? shift || isCapsLockOn()
      : shift !== isCapsLockOn();

    switch (getConfig.keymapLegendStyle) {
      case "blank":
        return { index: -1 };
      case "lowercase":
        return { index: 0 };
      case "uppercase":
        return { index: 1, symbolIndex: 0 };
      case "dynamic": {
        if (shift && alt) {
          return { index: 3 };
        } else if (alt) {
          return { index: 2 };
        }
        return { index: isShifted ? 1 : 0, symbolIndex: shift ? 1 : 0 };
      }
      default:
        return { index: 0 };
    }
  });

  const showFirstRow = createMemo(
    () =>
      (wordsHaveNumbers() && getConfig.keymapMode === "next") ||
      getConfig.keymapKeys === "full" ||
      getConfig.keymapKeys === "minimal_numrow" ||
      (getConfig.keymapKeys === "minimal" && props.layoutData.keymapShowTopRow),
  );

  const keyboardDef = createMemo(() =>
    convertLayoutToKeymap(props.layoutData, {
      keymapStyle: getConfig.keymapStyle,
      showAllKeys:
        getConfig.keymapKeys === "full" ||
        props.layoutData.matrixShowRightColumn === true,
    }),
  );

  return (
    <div
      data-ui-element="keymap"
      class="flex w-full flex-col items-center py-8 text-sm text-sub"
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
  layer: { index: number; symbolIndex?: number };
  showFirstRow: boolean;
  flashState: Record<string, FlashEntry | undefined>;
}) {
  return (
    <div
      class="w-fit xxs:zoom-(--kb-zoom-xxs) xs:zoom-(--kb-zoom-xs) sm:zoom-(--kb-zoom-sm) md:zoom-(--kb-zoom-md) lg:zoom-(--kb-zoom-lg) xl:zoom-(--kb-zoom-xl) 2xl:zoom-(--kb-zoom-2xl)"
      style={{
        "--kb-zoom-xxs": Math.min(getConfig.keymapSize, 0.5),
        "--kb-zoom-xs": Math.min(getConfig.keymapSize, 0.7),
        "--kb-zoom-sm": Math.min(getConfig.keymapSize, 1),
        "--kb-zoom-md": Math.min(getConfig.keymapSize, 1.3),
        "--kb-zoom-lg": Math.min(getConfig.keymapSize, 1.7),
        "--kb-zoom-xl": Math.min(getConfig.keymapSize, 2.2),
        "--kb-zoom-2xl": Math.min(getConfig.keymapSize, 2.9),
      }}
    >
      <For each={props.keyboardDef}>
        {(keys, rowNum) => (
          <Show when={rowNum() !== 0 || props.showFirstRow}>
            <div class="flex h-8 flex-row">
              <For each={keys}>
                {(key) => {
                  const label = () => {
                    let label = key.legends[props.layer.index];

                    if (props.layer.symbolIndex !== undefined) {
                      const keyIsSymbol = [
                        key.legends[props.layer.index],
                        key.legends[props.layer.symbolIndex],
                      ].some((character) =>
                        symbolsPattern.test(character ?? ""),
                      );

                      if (keyIsSymbol) {
                        label = key.legends[props.layer.symbolIndex];
                      }
                    }
                    return label ?? "";
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
        onComplete: () => {
          props.legends.forEach((l) => setKeymapFlashState(l, undefined));
          if (isFading()) {
            setIsFading(false);
          }
        },
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
