import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { showCommandLineForConfig } from "../../../states/core";
import { getModifierState, isCapsLockOn } from "../../../states/modifiers";
import {
  getKeymapHighlightKey,
  getKeymapLayout,
  keymapLayoutObject,
} from "../../../states/test";
import { cn } from "../../../utils/cn";
import { typedEntries } from "../../../utils/misc";
import { Button } from "../../common/Button";
import {
  convertLayoutToKeymap,
  KeyboardDefinition,
  KeyDefinition,
} from "./keymapConverter";

export function Keymap() {
  return (
    <Show when={keymapLayoutObject()} fallback={<div>Loading...</div>}>
      <Keyboard
        displayName={getKeymapLayout().layoutNameDisplayString}
        layoutData={keymapLayoutObject() as LayoutObject}
      />
    </Show>
  );
}

function Keyboard(props: { displayName: string; layoutData: LayoutObject }) {
  //TODO check for mac specific shift+capslock
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

  //TODO show if test has numbers and keymapMode is next
  const showFirstRow = createMemo(
    () =>
      (getConfig.keymapLayoutStyle === "full" ||
        getConfig.keymapLayoutStyle === "minimal_numrow" ||
        (getConfig.keymapLayoutStyle === "minimal_layout" &&
          props.layoutData.keymapShowTopRow)) ??
      false,
  );

  // Convert layout to KeyboardDefinition format
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
        />
      </Show>
    </div>
  );
}

function KeyboardDefinitionRenderer(props: {
  keyboardDef: KeyboardDefinition;
  layer: number;
  showFirstRow: boolean;
}) {
  return (
    <For each={typedEntries(props.keyboardDef)}>
      {([rowId, keys]) => (
        <Show when={rowId !== "row1" || props.showFirstRow}>
          <div class="flex h-8 flex-row">
            <For each={keys}>
              {(key) => <Key {...key} layer={props.layer} />}
            </For>
          </div>
        </Show>
      )}
    </For>
  );
}

function Key(
  props: {
    layer: number;
  } & KeyDefinition,
) {
  const isActive = () =>
    props.legends.some((it) => it === getKeymapHighlightKey());

  return (
    <div
      class={cn(
        "relative flex items-center justify-center rounded border-2 border-bg bg-sub-alt",
        (props.legends[props.layer] ?? "").length >= 3 && "text-em-xs",
        isActive() && "bg-main text-bg",
      )}
      style={{
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
      }}
    >
      <Show
        when={props.isLayoutIndicator}
        fallback={
          <>
            {props.legends[props.layer]}
            <Show when={props.isHoming}>
              <div
                class={cn(
                  "bg-em-xs absolute bottom-1 left-auto h-px w-2 rounded",
                  isActive() ? "bg-bg" : "bg-sub",
                )}
              ></div>
            </Show>
          </>
        }
      >
        <Button
          variant="text"
          active={isActive()}
          class="text-xs [--themable-button-active:var(--bg-color)]"
          text={getKeymapLayout().layoutNameDisplayString}
          onClick={() => showCommandLineForConfig("keymapLayout")}
        />
      </Show>
    </div>
  );
}
