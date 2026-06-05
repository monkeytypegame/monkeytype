import { Show } from "solid-js";

import { nonFirefoxCommandlineHotkey } from "../../input/hotkeys/commandline";
import { hotkeys } from "../../states/hotkeys";
import { isFirefox } from "../../utils/misc";
import { Kbd } from "../common/Kbd";

export function CommandlineHotkey() {
  return (
    <>
      <Kbd hotkey={hotkeys.commandline} />
      <Show when={!isFirefox()}>
        &nbsp;or&nbsp;
        <Kbd hotkey={nonFirefoxCommandlineHotkey} />
      </Show>
    </>
  );
}
