import { JSXElement, Show } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { ThemesList } from "../../../../constants/themes";
import { cn } from "../../../../utils/cn";
import { Button } from "../../../common/Button";
import SlimSelect from "../../../ui/SlimSelect";
import { Setting } from "../Setting";

export function AutoSwitchTheme(): JSXElement {
  return (
    <Setting
      title={
        configMetadata.autoSwitchTheme.displayString ?? "auto switch theme"
      }
      fa={configMetadata.autoSwitchTheme.fa}
      description={configMetadata.autoSwitchTheme.description}
      inputs={
        <div
          class={cn(
            "grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2",
          )}
        >
          <Button
            active={!getConfig.autoSwitchTheme}
            onClick={() => {
              if (!getConfig.autoSwitchTheme) return;
              setConfig("autoSwitchTheme", false);
            }}
            text="off"
          />
          <Button
            active={getConfig.autoSwitchTheme}
            onClick={() => {
              if (getConfig.autoSwitchTheme) return;
              setConfig("autoSwitchTheme", true);
            }}
            text="on"
          />
        </div>
      }
      fullWidthInputs={
        <Show when={getConfig.autoSwitchTheme}>
          <div class="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="grid grid-cols-[7rem_1fr] items-center gap-2">
              <div>light</div>
              <SlimSelect
                options={ThemesList.map((theme) => ({
                  text: theme.name.replace(/_/g, " "),
                  value: theme.name,
                }))}
                selected={getConfig.themeLight}
              />
            </div>
            <div class="grid grid-cols-[7rem_1fr] items-center gap-2">
              <div>dark</div>
              <SlimSelect
                options={ThemesList.map((theme) => ({
                  text: theme.name.replace(/_/g, " "),
                  value: theme.name,
                }))}
                selected={getConfig.themeDark}
              />
            </div>
          </div>
        </Show>
      }
    />
  );
}
