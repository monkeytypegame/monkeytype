import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getModifierState } from "../../../states/modifiers";
import { getKeymapLayout, keymapLayoutObject } from "../../../states/test";
import { typedEntries, typedValues } from "../../../utils/misc";
import { convertLayoutToKeymap, KeyboardDefinition } from "./keymapConverter";

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
  const hasAltGr = createMemo(() =>
    typedValues(props.layoutData.keys).some((key) =>
      key.some((legend) => legend.length > 2),
    ),
  );

  const layer = createMemo(() => {
    if (hasAltGr() && getModifierState().shift && getModifierState().altGr) {
      return 3;
    }
    if (hasAltGr() && getModifierState().altGr) return 2;
    if (getModifierState().shift) return 1;

    return 0;
  });

  const showFirstRow =
    getConfig.keymapShowTopRow === "always" ||
    (getConfig.keymapShowTopRow === "layout" &&
      keymapLayoutObject()?.keymapShowTopRow);

  // Convert layout to KeyboardDefinition format
  const keyboardDef = createMemo(() =>
    convertLayoutToKeymap(props.layoutData, {
      displayName: props.displayName,
      keymapStyle: getConfig.keymapStyle,
      showAllKeys: false,
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
              {(key) => (
                <Key
                  legend={key.legends.at(props.layer) ?? ""}
                  x={key.x}
                  width={key.width}
                  height={key.height}
                />
              )}
            </For>
          </div>
        </Show>
      )}
    </For>
  );
}

function Key(props: {
  legend: string;
  x?: number;
  width?: number;
  height?: number;
}) {
  return (
    <div
      class="flex items-center justify-center rounded border-2 border-bg bg-sub-alt"
      style={{
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 0.25}rem`,
      }}
    >
      {props.legend}
    </div>
  );
}
