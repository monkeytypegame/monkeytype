import { Show } from "solid-js";

import { getConfig } from "../../config/store";
import { isFirefox } from "../../utils/misc";
import { Conditional } from "../common/Conditional";
import { Kbd } from "./Kbd";

export function CommandlineHotkey() {
  return (
    <>
      <Conditional
        if={getConfig.quickRestart === "esc"}
        then={<Kbd hotkey="Tab" />}
        else={<Kbd hotkey="Escape" />}
      />
      <Show when={!isFirefox()}>
        &nbsp;or&nbsp;
        <Kbd hotkey="Mod+Shift+P" />
      </Show>
    </>
  );
}
