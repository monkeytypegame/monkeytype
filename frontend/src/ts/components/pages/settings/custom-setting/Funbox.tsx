import { checkCompatibility, getAllFunboxes } from "@monkeytype/funbox";
import { For, JSXElement, type JSX } from "solid-js";

// import { canSetFunboxWithConfig } from "../../../../config/funbox-validation";
import { configMetadata } from "../../../../config/metadata";
import { toggleFunbox } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { getActiveFunboxNames } from "../../../../test/funbox/list";
import { Button } from "../../../common/Button";
import { Setting } from "../Setting";

export function Funbox(): JSXElement {
  return (
    <Setting
      title="funbox"
      description={configMetadata.funbox.description}
      fa={configMetadata.funbox.fa}
      fullWidthInputs={
        <div class="grid grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))] gap-2">
          <For each={getAllFunboxes()}>
            {(funbox) => {
              const active = () => getConfig.funbox.includes(funbox.name);

              const disabled = () => {
                if (active()) return false;
                const incompatible = !checkCompatibility(
                  getActiveFunboxNames(),
                  funbox.name,
                );
                return incompatible;
                // const configIncompatible = !canSetFunboxWithConfig(
                //   funbox.name,
                //   getConfig,
                // ).ok;
                // return incompatible || configIncompatible;
              };

              const style = (): JSX.CSSProperties | undefined => {
                if (funbox.name === "mirror") {
                  return {
                    transform: "scaleX(-1)",
                  };
                }
                if (funbox.name === "upside_down") {
                  return {
                    transform: "scaleY(-1)",
                  };
                }
                return undefined;
              };

              const text = () => {
                if (funbox.name === "underscore_spaces") {
                  return "underscore_spaces";
                }
                return funbox.name.replace(/_/g, " ");
              };

              return (
                <div style={style()}>
                  <Button
                    active={active()}
                    onClick={() => {
                      toggleFunbox(funbox.name);
                    }}
                    disabled={disabled()}
                    balloon={{
                      text: funbox.description,
                      length: "xlarge",
                    }}
                    class="w-full"
                  >
                    {text()}
                  </Button>
                </div>
              );
            }}
          </For>
        </div>
      }
    />
  );
}
