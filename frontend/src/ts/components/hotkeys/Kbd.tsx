import { formatWithLabels, Hotkey } from "@tanstack/solid-hotkeys";
import { JSXElement } from "solid-js";

export function Kbd(props: { hotkey: Hotkey }): JSXElement {
  return (
    <kbd>
      {formatWithLabels(props.hotkey).toLowerCase().replace(/\+/g, " + ")}
    </kbd>
  );
}
