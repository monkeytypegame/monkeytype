import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getFocus } from "../../../states/test";
import { CommandlineHotkey } from "../../hotkeys/CommandlineHotkey";
import { QuickRestartHotkey } from "../../hotkeys/QuickRestartHotkey";

export function Keytips(): JSXElement {
  return (
    <Show when={getConfig.showKeyTips}>
      <div
        class="mb-8 flex flex-col items-center gap-2 transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <div class="flex items-center gap-2">
          <QuickRestartHotkey />
          <span>- restart test</span>
        </div>

        <div class="flex items-center gap-2">
          <CommandlineHotkey />
          <span>- command line</span>
        </div>
      </div>
    </Show>
  );
}
