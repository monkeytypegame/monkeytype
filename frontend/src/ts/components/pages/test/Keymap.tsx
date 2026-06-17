import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, For, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getModifierState } from "../../../states/modifiers";
import { getKeymapLayout, keymapLayoutObject } from "../../../states/test";
import { typedEntries, typedValues } from "../../../utils/misc";

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
  const keyboardDef = createMemo(() => props.layoutData);

  return (
    <div data-ui-element="keymap" class="flex flex-col gap-2 text-sm text-sub">
      <Show when={keyboardDef()} fallback={<div>Loading...</div>}>
        <KeyboardDefinitionRenderer
          keyboardDef={keyboardDef().keys}
          layer={layer()}
          showFirstRow={showFirstRow ?? false}
        />
      </Show>
    </div>
  );
}

function KeyboardDefinitionRenderer(props: {
  keyboardDef: LayoutObject["keys"];
  layer: number;
  showFirstRow: boolean;
}) {
  return (
    <For each={typedEntries(props.keyboardDef)}>
      {([rowId, keys]) => (
        <Show when={rowId !== "row1" || props.showFirstRow}>
          <div class="flex flex-row gap-2">
            <For each={keys}>
              {(key, col) => (
                <Show when={rowId !== "row4" || col() !== 0}>
                  <Key legend={key.at(props.layer) ?? ""} />
                </Show>
              )}
            </For>
          </div>
        </Show>
      )}
    </For>
  );
}

function Key(props: { legend: string; x?: number }) {
  return (
    <div
      class="flex h-8 aspect-square bg-sub-alt rounded justify-center items-center"
      style={{ transform: `translateX(${(props.x ?? 0) * 16}px)` }}
    >
      {props.legend}
    </div>
  );
}

type Row = "row1" | "row2" | "row3" | "row4" | "row5";
type KeyDefinition = {
  legends: KeyLegends;
  width: number;
  height: number;
  x: number;
};
type KeyboardDefinition = Record<Row, KeyDefinition[]>;
