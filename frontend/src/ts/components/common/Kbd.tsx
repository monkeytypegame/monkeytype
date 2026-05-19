import { formatForDisplay, Hotkey } from "@tanstack/solid-hotkeys";
import { JSXElement } from "solid-js";

type Props =
  | { hotkey: Hotkey; text?: undefined }
  | { hotkey?: undefined; text: string };

export function Kbd(props: Props): JSXElement {
  return (
    <kbd>
      {props.hotkey
        ? formatForDisplay(props.hotkey, { useSymbols: false })
            .toLowerCase()
            .replace(/\+/g, " + ")
        : props.text}
    </kbd>
  );
}
