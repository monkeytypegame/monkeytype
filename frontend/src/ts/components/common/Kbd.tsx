import { formatWithLabels, Hotkey } from "@tanstack/solid-hotkeys";
import { JSXElement } from "solid-js";

type Props =
  | { hotkey: Hotkey; text?: undefined }
  | { hotkey?: undefined; text: string };

export function Kbd(props: Props): JSXElement {
  return (
    <kbd>
      {props.hotkey
        ? formatWithLabels(props.hotkey).toLowerCase().replace(/\+/g, " + ")
        : props.text}
    </kbd>
  );
}
