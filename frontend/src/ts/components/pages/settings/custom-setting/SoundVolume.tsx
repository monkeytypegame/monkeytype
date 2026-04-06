import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { Slider } from "../../../common/Slider";
import { Setting } from "../Setting";

export function SoundVolume(): JSXElement {
  return (
    <Setting
      title="sound volume"
      description={configMetadata.soundVolume.description}
      fa={configMetadata.soundVolume.fa}
      inputs={
        <Slider
          min={0}
          max={1}
          step={0.1}
          text={(value) => {
            return value.toFixed(1);
          }}
          value={getConfig.soundVolume}
          onChange={(value) => {
            if (value === getConfig.soundVolume) return;
            setConfig("soundVolume", value);
          }}
        />
      }
    />
  );
}
