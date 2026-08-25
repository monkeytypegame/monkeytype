import { ConfigGroupNameSchema } from "@monkeytype/schemas/configs";
import { PresetType } from "@monkeytype/schemas/presets";
import { For, JSXElement, Show } from "solid-js";

import { camelCaseToWords } from "../../../utils/strings";
import { Button } from "../../common/Button";

export function FullOrPartial(props: {
  type: PresetType;
  onTypeChange: (type: PresetType) => void;
  renderCheckbox: (group: string, label: string) => JSXElement;
}): JSXElement {
  return (
    <div class="grid gap-2 text-xs">
      <div class="text-sub">preset type</div>
      <div class="grid grid-cols-2 gap-2">
        <Button
          text="full"
          active={props.type === "full"}
          onClick={() => props.onTypeChange("full")}
        />
        <Button
          text="partial"
          active={props.type === "partial"}
          onClick={() => props.onTypeChange("partial")}
        />
      </div>
      <Show when={props.type === "partial"}>
        <div class="text-sub">partial groups</div>
        <div class="grid grid-cols-2 gap-y-2">
          <For each={ConfigGroupNameSchema.options}>
            {(group) => props.renderCheckbox(group, camelCaseToWords(group))}
          </For>
        </div>
      </Show>
    </div>
  );
}
