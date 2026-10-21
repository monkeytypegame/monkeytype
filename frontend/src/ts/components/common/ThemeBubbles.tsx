import { ColorHexValue } from "@monkeytype/schemas/configs";

import { cn } from "../../utils/cn";

// rendered for every theme on the settings page and in the commandline - a
// single element: the bubbles are background gradients (theme-bubbles), the
// colors css vars in one style binding
export function ThemeBubbles(props: {
  inset: boolean;
  colors: {
    bg: ColorHexValue;
    main: ColorHexValue;
    sub: ColorHexValue;
    text: ColorHexValue;
  };
  class?: string;
}) {
  return (
    <div
      class={cn("theme-bubbles", props.inset && "-my-1", props.class)}
      style={{
        "--bubble-bg": props.colors.bg,
        "--bubble-main": props.colors.main,
        "--bubble-sub": props.colors.sub,
        "--bubble-text": props.colors.text,
      }}
    ></div>
  );
}
