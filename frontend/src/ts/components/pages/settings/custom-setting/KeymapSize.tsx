import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { Slider } from "../../../common/Slider";
import { Setting } from "../Setting";

export function KeymapSize(): JSXElement {
  return (
    <Setting
      title="keymap size"
      description={configMetadata.keymapSize.description}
      fa={configMetadata.keymapSize.fa}
      inputs={
        <Slider
          min={0.5}
          max={3.5}
          step={0.1}
          text={(value) => {
            return value.toFixed(1);
          }}
          value={getConfig.keymapSize}
          onChange={(value) => {
            if (value === getConfig.keymapSize) return;
            setConfig("keymapSize", value);
          }}
        />
      }
    />
  );
}
