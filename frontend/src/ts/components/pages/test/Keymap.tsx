import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, createSignal, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { keymapEvent } from "../../../events/keymap";
import { showCommandLineForConfig } from "../../../states/core";
import { getModifierState, isCapsLockOn } from "../../../states/modifiers";
import {
  getKeymapHighlightKey,
  getKeymapLayout,
  keymapLayoutObject,
  wordsHaveNumbers,
} from "../../../states/test";
import { getTheme } from "../../../states/theme";
import { cn } from "../../../utils/cn";
import { isMacLike, typedEntries } from "../../../utils/misc";
import { Anime } from "../../common/anime";
import { Button } from "../../common/Button";
import {
  convertLayoutToKeymap,
  KeyboardDefinition,
  KeyDefinition,
} from "./keymapConverter";

type FlashEntry = { tick: number; correct: boolean };

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
    switch (getConfig.keymapLegendStyle) {
      case "blank":
        return -1;
      case "lowercase":
        return 0;
      case "uppercase":
        return 1;
      case "dynamic": {
        if (getModifierState().shift && getModifierState().altGr) {
          return 3;
        } else if (getModifierState().altGr) {
          return 2;
        } else if (getModifierState().shift || isCapsLockOn()) {
          return 1;
        }
        return 0;
      }
      default:
        return 0;
    }
  });

  const [flashState, setFlashState] = createSignal<Map<string, FlashEntry>>(
    new Map(),
  );

  keymapEvent.useListener((event) => {
    if (event.mode === "flash") {
      const key = event.key || " ";
      const current = flashState();
      const next = new Map<string, FlashEntry>();
      const existing = current.get(key);
      next.set(key, {
        tick: existing ? existing.tick + 1 : 1,
        correct: event.correct ?? true,
      });
      setFlashState(next);
    } else {
      // highlight event — reset flash state
      setFlashState(new Map());
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

  //TODO handle funbox layout_mirror
  const keyboardDef = createMemo(() =>
    convertLayoutToKeymap(props.layoutData, {
      displayName: props.displayName,
      keymapStyle: getConfig.keymapStyle,
      showAllKeys: getConfig.keymapLayoutStyle === "full",
    }),
  );

  return (
    <div data-ui-element="keymap" class="flex flex-col text-sm text-sub">
      <Show when={keyboardDef()} fallback={<div>Loading...</div>}>
        <KeyboardDefinitionRenderer
          keyboardDef={keyboardDef()}
          layer={layer()}
          showFirstRow={showFirstRow()}
          flashState={flashState}
        />
      </Show>
    </div>
  );
}

function KeyboardDefinitionRenderer(props: {
  keyboardDef: KeyboardDefinition;
  layer: number;
  showFirstRow: boolean;
  flashState: () => Map<string, FlashEntry>;
}) {
  return (
    <For each={typedEntries(props.keyboardDef)}>
      {([rowId, keys]) => (
        <Show when={rowId !== "row1" || props.showFirstRow}>
          <div class="flex h-8 flex-row">
            <For each={keys}>
              {(key) => (
                <Key
                  {...key}
                  isNumRow={rowId === "row1"}
                  layer={props.layer}
                  flashState={props.flashState}
                />
              )}
            </For>
          </div>
        </Show>
      )}
    </For>
  );
}

function Key(
  props: {
    isNumRow: boolean;
    layer: number;
    flashState: () => Map<string, FlashEntry>;
  } & KeyDefinition,
) {
  const isSteno = () =>
    getConfig.keymapStyle === "steno" ||
    getConfig.keymapStyle === "steno_matrix";

  const label = () => {
    const layer =
      props.isNumRow && isMacLike() && isCapsLockOn()
        ? props.layer - 1
        : props.layer;
    return props.legends[layer] ?? "";
  };

  // Read from centralized flash state instead of managing per-key signals.
  // Steno keys never flash.
  const flashInfo = createMemo(() => {
    if (isSteno()) return { tick: 0, correct: true };
    const entry = props.flashState().get(label());
    return { tick: entry?.tick ?? 0, correct: entry?.correct ?? true };
  });

  const isNext = () =>
    !isSteno() &&
    props.legends?.some((legend) => legend === getKeymapHighlightKey());

  return (
    <Anime
      class={cn(
        "relative flex items-center justify-center rounded border-2 border-bg bg-sub-alt",
        (label() ?? "").length >= 3 && "text-em-xs",
      )}
      style={{
        "--keybgcolor": isNext() ? getTheme().main : getTheme().subAlt,
        "--keycolor": isNext() ? getTheme().bg : getTheme().sub,
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
        transform:
          props.rotation !== undefined ? `rotate(${props.rotation}deg)` : "",
        "background-color": "var(--keybgcolor)",
        color: "var(--keycolor)",
      }}
      animation={{
        "--keybgcolor":
          flashInfo().tick === 0
            ? [isNext() ? getTheme().main : getTheme().subAlt]
            : [
                flashInfo().correct ? getTheme().main : getTheme().error,
                isNext() ? getTheme().main : getTheme().subAlt,
              ],
        "--keycolor":
          flashInfo().tick === 0
            ? [isNext() ? getTheme().bg : getTheme().sub]
            : [getTheme().bg, isNext() ? getTheme().bg : getTheme().sub],
        duration: isNext() ? 0 : 250,
      }}
    >
      <Show
        when={props.isLayoutIndicator}
        fallback={
          <>
            {label()}
            <Show when={props.isHoming}>
              <div
                class={cn(
                  "bg-em-xs absolute bottom-1 left-auto h-px w-2 rounded",
                )}
                style={{
                  "background-color": "var(--keycolor)",
                }}
              ></div>
            </Show>
          </>
        }
      >
        <Button
          variant="text"
          class="text-xs [--themable-button-bg:transparent] [--themable-button-text:var(--keycolor)]"
          text={getKeymapLayout().layoutNameDisplayString}
          onClick={() => showCommandLineForConfig("keymapLayout")}
          tabIndex={-1}
        />
      </Show>
    </Anime>
  );
}
