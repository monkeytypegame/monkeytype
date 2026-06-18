import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getModifierState } from "../../../states/modifiers";
import { getKeymapLayout, keymapLayoutObject } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { typedEntries } from "../../../utils/misc";
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
        } else if (getModifierState().shift) {
          return 1;
        }
        return 0;
      }
    }
  });

  const showFirstRow =
    getConfig.keymapLayoutStyle === "full" ||
    getConfig.keymapLayoutStyle === "minimal_numrow" ||
    (getConfig.keymapLayoutStyle === "minimal" &&
      keymapLayoutObject()?.keymapShowTopRow);

  // Convert layout to KeyboardDefinition format
  const keyboardDef = createMemo(() =>
    convertLayoutToKeymap(props.layoutData, {
      displayName: props.displayName,
      keymapStyle: getConfig.keymapStyle,
      showAllKeys: getConfig.keymapLayoutStyle === "full",
    }),
  );

  return (
    <div data-ui-element="keymap" class="flex flex-col gap-2 text-sm text-sub">
      <Show when={keyboardDef()} fallback={<div>Loading...</div>}>
        <KeyboardDefinitionRenderer
          keyboardDef={keyboardDef()}
          layer={layer()}
          showFirstRow={showFirstRow ?? false}
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
          <div class="flex flex-row">
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
  return (
    <div
      class={cn(
        "flex items-center justify-center rounded border-2 border-bg bg-sub-alt",
        (props.legends[props.layer] ?? "").length >= 3 && "text-em-xs",
      )}
      style={{
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 0.25}rem`,
      }}
    >
      {props.legends[props.layer]}
    </div>
  );
}
