import { KeymapLayout as KeymapLayoutSchema } from "@monkeytype/schemas/configs";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { LayoutsList } from "../../../../constants/layouts";
import SlimSelect from "../../../ui/SlimSelect";
import { Setting } from "../Setting";

export function KeymapLayout(): JSXElement {
  return (
    <Setting
      title="keymap layout"
      description={configMetadata.keymapLayout.description}
      fa={configMetadata.keymapLayout.fa}
      inputs={
        <SlimSelect
          appendToBody
          options={[
            {
              text: "emulator sync",
              value: "overrideSync",
            },
            ...LayoutsList.map((layout) => {
              return {
                text: layout.replace(/_/g, " "),
                value: layout,
              };
            }),
          ]}
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
