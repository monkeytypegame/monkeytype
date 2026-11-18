import { KeymapLayout as KeymapLayoutSchema } from "@monkeytype/schemas/configs";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { LayoutsList } from "../../../../constants/layouts";
import SlimSelect from "../../../ui/SlimSelect";
import { SearchableSetting } from "../SearchableSetting";

// built once - a new array on every read would make SlimSelect rebuild its options
const keymapLayoutOptions = [
  {
    text: "emulator sync",
    value: "overrideSync",
  },
  ...LayoutsList.map((layout) => ({
    text: layout.replace(/_/g, " "),
    value: layout,
  })),
];

export function KeymapLayout(): JSXElement {
  return (
    <SearchableSetting
      key="keymapLayout"
      title="keymap layout"
      description={configMetadata.keymapLayout.description}
      fa={configMetadata.keymapLayout.fa}
      inputs={
        <SlimSelect
          options={keymapLayoutOptions}
          selected={getConfig.keymapLayout}
          onChange={(val) => {
            if (getConfig.keymapLayout === (val as KeymapLayoutSchema)) return;
            setConfig("keymapLayout", val as KeymapLayoutSchema);
          }}
        />
      }
    />
  );
}
