import { Config, ConfigSchema } from "@monkeytype/schemas/configs";
import { For, JSXElement } from "solid-js";

import { configMetadata } from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { getOptions } from "../../../utils/zod";
import { Button } from "../../common/Button";
import { Setting } from "./Setting";

export function Settings(): JSXElement {
  return (
    <div class="grid gap-8 outline">
      <KeyedSetting key="resultSaving" autoInputs />
      <KeyedSetting key="difficulty" autoInputs />
    </div>
  );
}

function KeyedSetting(props: {
  key: keyof Config;
  inputs?: JSXElement;
  fullWidthInputs?: JSXElement;
  autoInputs?: boolean;
}): JSXElement {
  const inputs = () => {
    if (props.autoInputs === true) {
      const options = getOptions(ConfigSchema.shape[props.key]);
      if (options !== undefined) {
        return (
          <div class="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2">
            <For each={options}>
              {(option) => {
                const text = () => {
                  const optionsMeta = configMetadata[props.key]
                    .optionsMetadata as
                    | Record<string, { displayString?: string }>
                    | undefined;
                  const match = optionsMeta?.[String(option)];
                  if (match?.displayString !== undefined) {
                    return match.displayString;
                  }

                  if (option === true) {
                    return "on";
                  }
                  if (option === false) {
                    return "off";
                  }

                  return option.toString();
                };
                return (
                  <Button
                    active={getConfig[props.key] === option}
                    onClick={() => {
                      if (getConfig[props.key] === option) return;
                      setConfig(props.key, option);
                    }}
                  >
                    {text()}
                  </Button>
                );
              }}
            </For>
          </div>
        );
      }
    }
    return props.inputs;
  };

  return (
    <Setting
      title={configMetadata[props.key].displayString ?? props.key}
      fa={configMetadata[props.key].fa}
      description={configMetadata[props.key].description}
      inputs={inputs()}
      fullWidthInputs={props.fullWidthInputs}
    />
  );
}
