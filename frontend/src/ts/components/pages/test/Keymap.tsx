import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getModifierState, isCapsLockOn } from "../../../states/modifiers";
import {
  FlashEntry,
  getKeymapFlashState,
  getKeymapLayout,
  keymapLayoutObject,
  wordsHaveNumbers,
} from "../../../states/test";
import { cn } from "../../../utils/cn";
import { isMacLike } from "../../../utils/misc";
import { Anime } from "../../common/anime/Anime";
import { Keymap3D } from "./Keymap3D";
import { convertLayoutToKeymap } from "./keymapConverter";
import { createKeyVisualState, keyLabel, KeyContent } from "./keymapKey";
import { KeyboardDefinition, KeyDefinition } from "./keymapLayouts";

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

  const zoomClass =
    "w-fit xxs:zoom-(--kb-zoom-xxs) xs:zoom-(--kb-zoom-xs) sm:zoom-(--kb-zoom-sm) md:zoom-(--kb-zoom-md) lg:zoom-(--kb-zoom-lg) xl:zoom-(--kb-zoom-xl) 2xl:zoom-(--kb-zoom-2xl)";

  const zoomVars = {
    "--kb-zoom-xxs": Math.min(getConfig.keymapSize, 0.5),
    "--kb-zoom-xs": Math.min(getConfig.keymapSize, 0.7),
    "--kb-zoom-sm": Math.min(getConfig.keymapSize, 1),
    "--kb-zoom-md": Math.min(getConfig.keymapSize, 1.3),
    "--kb-zoom-lg": Math.min(getConfig.keymapSize, 1.7),
    "--kb-zoom-xl": Math.min(getConfig.keymapSize, 2.2),
    "--kb-zoom-2xl": Math.min(getConfig.keymapSize, 2.9),
  };

  return (
    <div
      data-ui-element="keymap"
      class="flex w-full flex-col items-center py-8 text-sm text-sub"
    >
      <Show when={keyboardDef()} fallback={<div>Loading...</div>}>
        <div class={zoomClass} style={zoomVars}>
          <Show
            when={getConfig.keymapDimension === "3d"}
            fallback={
              <KeyboardDefinitionRenderer
                keyboardDef={keyboardDef()}
                layer={layer()}
                showFirstRow={showFirstRow()}
                flashState={getKeymapFlashState}
              />
            }
          >
            <Keymap3D
              keyboardDef={keyboardDef()}
              layer={layer()}
              showFirstRow={showFirstRow()}
              flashState={getKeymapFlashState}
            />
          </Show>
        </div>
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
    <For each={props.keyboardDef}>
      {(keys, rowNum) => (
        <Show when={rowNum() !== 0 || props.showFirstRow}>
          <div class="flex h-8 flex-row">
            <For each={keys}>
              {(key) => {
                const label = () => keyLabel(key, props.layer);
                const flashEntry = () =>
                  key.legends
                    .map((legend) => props.flashState[legend])
                    .find((it) => it !== undefined);
                return <Key {...key} label={label()} flashEntry={flashEntry} />;
              }}
            </For>
          </div>
        </Show>
      )}
    </For>
  );
}

function Key(
  props: {
    label: string;
    flashEntry: () => FlashEntry | undefined;
  } & KeyDefinition,
) {
  const visual = createKeyVisualState(props);

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
        "--keybgcolor": visual.baseKeyBgColor(),
        "--keycolor": visual.baseKeyColor(),
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
        "margin-top": `${(props.y ?? 0) * 2}rem`,
        transform:
          props.rotation !== undefined ? `rotate(${props.rotation}deg)` : "",
        "background-color": "var(--keybgcolor)",
        color: "var(--keycolor)",
      }}
      // Don't apply reduced motion. If the user activates react/next they want animations.
      respectReducedMotion={false}
      animation={{
        "--keybgcolor": visual.animKeyBgColor(),
        "--keycolor": visual.animKeyColor(),
        duration: visual.animDuration(),
        onComplete: () => visual.resetFlash(),
      }}
    >
      <KeyContent {...props} visual={visual} />
    </Anime>
  );
}
